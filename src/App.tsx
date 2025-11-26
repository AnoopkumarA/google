import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SetupForm from './components/SetupForm';
import AssistantOverlay from './components/AssistantOverlay';
import { ResumeContext } from './types';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-400 bg-zinc-900 h-full w-full overflow-auto border border-red-900/50 flex flex-col items-center justify-center">
          <h1 className="text-lg font-bold mb-2 text-red-200">Application Error</h1>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-black/30 p-3 rounded border border-red-900/30 max-w-full overflow-x-auto">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-200 rounded text-xs transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [context, setContext] = useState<ResumeContext | null>(null);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (window.electron) {
      setIsNative(true);
      window.electron.resizeWindow(800, 800).catch(console.error);
    }
  }, []);

  const handleSetupComplete = (ctx: ResumeContext) => {
    setContext(ctx);
    if (isNative && window.electron) {
      setTimeout(() => {
        window.electron!.resizeWindow(400, 600).catch(console.error);
      }, 100);
    }
  };

  const handleBack = () => {
    setContext(null);
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }
    if (isNative && window.electron) {
      window.electron.resizeWindow(800, 800).catch(console.error);
    }
  };

  // ✨ FIXED copyStyles — enables auto-scroll inside popup / PiP overlay
  const copyStyles = (targetDoc: Document) => {
    Array.from(document.head.children).forEach(node => {
      targetDoc.head.appendChild(node.cloneNode(true));
    });

    targetDoc.documentElement.style.height = "100%";
    targetDoc.documentElement.style.minHeight = "0";
    targetDoc.documentElement.style.overflow = "hidden";

    targetDoc.body.style.backgroundColor = "#000";
    targetDoc.body.style.margin = "0";
    targetDoc.body.style.padding = "0";
    targetDoc.body.style.height = "100%";
    targetDoc.body.style.minHeight = "0";
    targetDoc.body.style.display = "flex";
    targetDoc.body.style.flexDirection = "column";
    targetDoc.body.style.overflow = "hidden";
  };

  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    // @ts-ignore
    if (window.documentPictureInPicture) {
      try {
        // @ts-ignore
        const pip = await window.documentPictureInPicture.requestWindow({
          width: 400,
          height: 600,
        });
        copyStyles(pip.document);
        pip.addEventListener("pagehide", () => setPipWindow(null));
        setPipWindow(pip);
      } catch (err) {
        fallbackToPopup();
      }
    } else {
      fallbackToPopup();
    }
  };

  const fallbackToPopup = () => {
    try {
      const popup = window.open('', 'InterviewAssistant', `width=400,height=600,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
      if (popup) {
        copyStyles(popup.document);
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            setPipWindow(null);
          }
        }, 500);
        setPipWindow(popup);
      }
    } catch (e) {
      alert("Popup blocked.");
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden min-h-0 bg-black selection:bg-blue-500/30 selection:text-blue-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-900/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col min-h-0 overflow-hidden">
        <ErrorBoundary>
          {!context ? (
            <SetupForm onComplete={handleSetupComplete} />
          ) : (
            <>
              {isNative ? (
                <AssistantOverlay 
                  context={context}
                  onBack={handleBack}
                  onTogglePiP={togglePiP}
                  isPiP={true}
                  isNative={true}
                />
              ) : (
                <>
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-4xl font-bold text-white mb-4">{context.jobTitle} Interview</h2>
                    <p className="text-neutral-400 max-w-md mb-8">
                      {pipWindow ? "Ghost Mode Active. Check your overlay." 
                                 : "Ready. Launch the invisible overlay to begin."}
                    </p>

                    {pipWindow && (
                      <button
                        onClick={() => { pipWindow.close(); setPipWindow(null); }}
                        className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                      >
                        Restore to Browser
                      </button>
                    )}
                  </div>

                  {pipWindow ? (
                    createPortal(
                      <AssistantOverlay
                        context={context}
                        onBack={handleBack}
                        onTogglePiP={togglePiP}
                        isPiP={true}
                        isNative={false}
                      />,
                      pipWindow.document.body
                    )
                  ) : (
                    <AssistantOverlay
                      context={context}
                      onBack={handleBack}
                      onTogglePiP={togglePiP}
                      isPiP={false}
                      isNative={false}
                    />
                  )}
                </>
              )}
            </>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default App;
