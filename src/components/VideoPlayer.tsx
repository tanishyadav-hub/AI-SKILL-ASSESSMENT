import React, { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  sessionId: string; // Changing this forces re-initialization for new sessions
  onEnded: () => void;
  onError: (error: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, sessionId, onEnded, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Cleanup and re-initialize whenever the session or URL changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Reset state for the new session
    setHasError(false);
    setRetryCount(0);
    
    // Force reload of the video element
    videoElement.load(); 
    videoElement.play().catch((err) => {
      console.error("Playback failed to start automatically:", err);
    });

    // Cleanup logic when component unmounts or session changes
    return () => {
      videoElement.pause();
      videoElement.removeAttribute('src'); // Clear source to free memory
      videoElement.load();
    };
  }, [sessionId, videoUrl]);

  const handleError = () => {
    console.error(`[VideoPlayer] Failed to load video: ${videoUrl}`);
    
    if (retryCount < 1) {
      console.log("[VideoPlayer] Retrying video load...");
      setRetryCount((prev) => prev + 1);
      
      // Attempt to reload the video after a short delay
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().catch(console.error);
        }
      }, 1000);
    } else {
      // Stop retrying and show error state
      setHasError(true);
      onError("Failed to load video after retries.");
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-900 text-white rounded-lg p-6 text-center border border-red-500">
        <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-semibold">Video Failed to Load</p>
        <p className="text-slate-400 mt-2">There was an issue streaming the assessment. Please check your connection or restart the session.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black shadow-xl">
      {/* 
        Using 'key={sessionId}' is a React trick that completely destroys 
        and recreates the <video> DOM node on new sessions, preventing 
        stale state (blank screens) from previous runs.
      */}
      <video
        key={sessionId} 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-auto aspect-video"
        controls
        playsInline
        onEnded={onEnded}
        onError={handleError}
      />
    </div>
  );
};
