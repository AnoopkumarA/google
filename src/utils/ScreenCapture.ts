
export const captureScreen = async (): Promise<string> => {
    // 1. Native Electron Mode
    if (window.electron && window.electron.captureScreen) {
        return await window.electron.captureScreen();
    }

    // 2. Browser Mode Fallback
    try {
        // Request user to select a screen/window to capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        await video.play();

        // Wait a moment for the video to actually render a frame
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            stream.getTracks().forEach(t => t.stop());
            throw new Error("Could not create canvas context");
        }

        ctx.drawImage(video, 0, 0);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8);

        // Immediately stop the stream so the "Sharing" banner disappears
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        canvas.remove();

        return base64Data;

    } catch (error: any) {
        if (error.name === 'NotAllowedError') {
            throw new Error("Screen selection was cancelled.");
        }
        console.error("Browser screen capture failed:", error);
        throw new Error("Failed to capture screen in browser.");
    }
};
