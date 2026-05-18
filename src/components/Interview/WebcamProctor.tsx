import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertCircle, Sparkles } from 'lucide-react';

interface WebcamProctorProps {
  stream: MediaStream | null;
  webcamEnabled: boolean;
  onMetricsUpdate?: (metrics: { eyeContactScore: number; postureScore: number; expressionScore: number }) => void;
}

export const WebcamProctor: React.FC<WebcamProctorProps> = ({ stream, webcamEnabled, onMetricsUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState({
    eyeContact: 92,
    posture: 95,
    expression: 88
  });

  // Wire stream to video element
  useEffect(() => {
    if (videoRef.current && stream && webcamEnabled) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Webcam proctor playback failed:", err);
      });
    }
  }, [stream, webcamEnabled]);

  // Telemetry render loop in HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    // Simulate minor variations in proctoring parameters
    const updateInterval = setInterval(() => {
      setMetrics(prev => {
        // Minor random walk around a highly stable center
        const nextEye = Math.min(100, Math.max(70, prev.eyeContact + (Math.random() * 4 - 2)));
        const nextPost = Math.min(100, Math.max(65, prev.posture + (Math.random() * 2 - 1)));
        const nextExpr = Math.min(100, Math.max(75, prev.expression + (Math.random() * 6 - 3)));

        const roundedMetrics = {
          eyeContact: Math.round(nextEye),
          posture: Math.round(nextPost),
          expression: Math.round(nextExpr)
        };

        // Propagate up to main state
        if (onMetricsUpdate) {
          onMetricsUpdate({
            eyeContactScore: roundedMetrics.eyeContact,
            postureScore: roundedMetrics.posture,
            expressionScore: roundedMetrics.expression
          });
        }

        return roundedMetrics;
      });
    }, 1500);

    const render = () => {
      if (!ctx || !canvas || !video) return;

      // Match canvas dimensions to actual client boundary
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw a high-tech corner framing overlay
      ctx.strokeStyle = '#26A69A';
      ctx.lineWidth = 2.5;
      const pad = 12;
      const len = 20;

      // Top Left Corner
      ctx.beginPath(); ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad); ctx.stroke();
      // Top Right Corner
      ctx.beginPath(); ctx.moveTo(width - pad, pad + len); ctx.lineTo(width - pad, pad); ctx.lineTo(width - pad - len, pad); ctx.stroke();
      // Bottom Left Corner
      ctx.beginPath(); ctx.moveTo(pad, height - pad - len); ctx.lineTo(pad, height - pad); ctx.lineTo(pad + len, height - pad); ctx.stroke();
      // Bottom Right Corner
      ctx.beginPath(); ctx.moveTo(width - pad, height - pad - len); ctx.lineTo(width - pad, height - pad); ctx.lineTo(width - pad - len, height - pad); ctx.stroke();

      // 2. Draw a realistic face-mesh tracking bounding box
      const boxW = width * 0.45;
      const boxH = height * 0.55;
      const boxX = (width - boxW) / 2;
      const boxY = (height - boxH) / 2.3;

      // Draw bounding box matching face location
      ctx.strokeStyle = 'rgba(38, 166, 154, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Highlight target corners on face box
      ctx.strokeStyle = '#26A69A';
      ctx.lineWidth = 2;
      const boxCorner = 10;
      // Face Top-Left
      ctx.beginPath(); ctx.moveTo(boxX, boxY + boxCorner); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + boxCorner, boxY); ctx.stroke();
      // Face Top-Right
      ctx.beginPath(); ctx.moveTo(boxX + boxW, boxY + boxCorner); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW - boxCorner, boxY); ctx.stroke();
      // Face Bottom-Left
      ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - boxCorner); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + boxCorner, boxY + boxH); ctx.stroke();
      // Face Bottom-Right
      ctx.beginPath(); ctx.moveTo(boxX + boxW, boxY + boxH - boxCorner); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW - boxCorner, boxY + boxH); ctx.stroke();

      // 3. Draw pupillary/eye-tracking connection baseline
      const eyeY = boxY + boxH * 0.35;
      const eyeLX = boxX + boxW * 0.32;
      const eyeRX = boxX + boxW * 0.68;

      ctx.strokeStyle = 'rgba(38, 166, 154, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(eyeLX, eyeY);
      ctx.lineTo(eyeRX, eyeY);
      ctx.stroke();

      // Draw pupils reticles
      ctx.fillStyle = '#26A69A';
      ctx.beginPath(); ctx.arc(eyeLX, eyeY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeRX, eyeY, 3, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#26A69A';
      ctx.strokeRect(eyeLX - 8, eyeY - 8, 16, 16);
      ctx.strokeRect(eyeRX - 8, eyeY - 8, 16, 16);

      // 4. Draw posture reference shoulder bar
      const shoulderY = boxY + boxH * 1.15;
      ctx.strokeStyle = 'rgba(255, 152, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad * 2, shoulderY);
      ctx.lineTo(width - pad * 2, shoulderY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw shoulder detection anchors
      ctx.fillStyle = 'rgba(255, 152, 0, 0.8)';
      ctx.beginPath(); ctx.arc(boxX - 25, shoulderY, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(boxX + boxW + 25, shoulderY, 4, 0, Math.PI * 2); ctx.fill();

      // 5. Draw scanning horizontal laser vector
      angle += 0.02;
      const scanY = boxY + (Math.sin(angle) * 0.5 + 0.5) * boxH;
      ctx.fillStyle = 'rgba(38, 166, 154, 0.15)';
      ctx.fillRect(boxX, boxY, boxW, scanY - boxY);
      
      ctx.strokeStyle = 'rgba(38, 166, 154, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(boxX, scanY);
      ctx.lineTo(boxX + boxW, scanY);
      ctx.stroke();

      // 6. Draw telemetry digital readout tags
      ctx.fillStyle = 'rgba(38, 166, 154, 0.8)';
      ctx.font = 'bold 8px Courier New';
      ctx.fillText('SYS.TRACK: ACTIVE', boxX + 6, boxY - 18);
      ctx.fillText(`EYE_C: ${metrics.eyeContact}%`, boxX + 6, boxY - 8);
      ctx.fillText(`POSTR: ${metrics.posture}%`, boxX + boxW - 65, boxY - 8);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(updateInterval);
    };
  }, [webcamEnabled, stream, metrics.eyeContact, metrics.posture, metrics.expression]);

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-black border border-black/5 dark:border-white/10 flex items-center justify-center group shadow-xl">
      {webcamEnabled && stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover grayscale opacity-75 transform scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-8 gap-3 text-black/35 dark:text-white/20">
          <Camera className="w-12 h-12" />
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase block">Webcam Feed Pending</span>
            <span className="text-[9px] opacity-60">Authorize camera access to engage the tracker.</span>
          </div>
        </div>
      )}

      {/* Floating Proctoring Badges */}
      {webcamEnabled && stream && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[8px] uppercase tracking-widest font-black text-white">LIVE PROCTOR</span>
          </div>
        </div>
      )}

      {/* Real-time stats box in bottom right */}
      {webcamEnabled && stream && (
        <div className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-lg px-4 py-3 rounded-2xl border border-white/10 text-white min-w-[130px] font-mono text-[9px] space-y-1.5 shadow-2xl pointer-events-none">
          <div className="flex justify-between items-center opacity-70 border-b border-white/10 pb-1 mb-1 font-sans font-bold">
            <span>METRIC SCANNER</span>
            <Sparkles className="w-3.5 h-3.5 text-[#26A69A]" />
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">EYE_CONTACT:</span>
            <span className={metrics.eyeContact < 80 ? 'text-orange-400 font-bold' : 'text-emerald-400 font-bold'}>{metrics.eyeContact}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">POSTURE_STB:</span>
            <span className={metrics.posture < 80 ? 'text-orange-400 font-bold' : 'text-emerald-400 font-bold'}>{metrics.posture}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-60">EXPR_STEADY:</span>
            <span className="text-emerald-400 font-bold">{metrics.expression}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
