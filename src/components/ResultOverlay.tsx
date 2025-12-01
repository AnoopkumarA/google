import React, { useState } from 'react';
import { ICONS } from '../constants';

interface ResultOverlayProps {
    content: string;
    isVisible: boolean;
    onClose: () => void;
}

const copyText = async (text: string) => {
    try {
        if (window.electron && window.electron.writeToClipboard) {
            window.electron.writeToClipboard(text);
        } else {
            // Browser fallback
            await navigator.clipboard.writeText(text);
        }
    } catch (error) {
        console.warn("Clipboard API failed, trying legacy fallback:", error);
        // Legacy fallback for when Clipboard API fails (e.g. focus issues)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        } catch (err) {
            console.error('All copy methods failed:', err);
        }
    }
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await copyText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl group">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <span className="text-xs font-mono text-neutral-400 ml-2 lowercase">{language || 'code'}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-all duration-200 ${copied
                        ? 'bg-green-500/10 text-green-400'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                        }`}
                >
                    {copied ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <ICONS.Copy />
                            <span>Copy Code</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar">
                <pre className="font-mono text-sm text-blue-100/90 leading-relaxed">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};

const ResultOverlay: React.FC<ResultOverlayProps> = ({ content, isVisible, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyFull = async () => {
        await copyText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isVisible) return null;

    const renderContent = () => {
        const parts = content.split(/```/);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                // Code block
                const lines = part.trim().split('\n');
                const language = lines[0].trim();
                const code = lines.slice(1).join('\n');
                return <CodeBlock key={index} language={language} code={code} />;
            } else {
                // Regular text
                if (!part.trim()) return null;
                return (
                    <div key={index} className="whitespace-pre-wrap mb-4 text-neutral-300 leading-7">
                        {part.split('**').map((chunk, i) =>
                            i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{chunk}</strong> : chunk
                        )}
                    </div>
                );
            }
        });
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <ICONS.Zap />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">AI Analysis</h3>
                        <p className="text-[10px] text-purple-300 font-medium tracking-wider uppercase">Gemini 2.5 Pro</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyFull}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${copied
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                            }`}
                        title="Copy full response"
                    >
                        {copied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Copied All</span>
                            </>
                        ) : (
                            <>
                                <ICONS.Copy />
                                <span>Copy Full</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-neutral-400 transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/5 bg-black/40 text-[10px] text-neutral-500 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Analysis Complete</span>
                </div>
                <span className="font-mono opacity-50">ESC to close</span>
            </div>
        </div>
    );
};

export default ResultOverlay;
