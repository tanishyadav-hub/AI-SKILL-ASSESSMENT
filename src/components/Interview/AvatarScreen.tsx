import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Sparkles, MessageSquare, Brain } from 'lucide-react';

type AvatarState = 'listening' | 'thinking' | 'speaking';

interface AvatarScreenProps {
  avatarState: AvatarState;
  speakingText: string;
  voiceAudioUrl: string | null;
  onSpeechEnd?: () => void;
}

export const AvatarScreen: React.FC<AvatarScreenProps> = ({ 
  avatarState, 
  speakingText, 
  voiceAudioUrl,
  onSpeechEnd 
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(15).fill(4));
  const animationFrameRef = useRef<number | null>(null);

  // Synchronize audio and fallback WebSpeech API playback
  useEffect(() => {
    // 1. Clean up previous voice playbacks
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (avatarState !== 'speaking' || !speakingText) {
      setWaveformBars(Array(15).fill(4));
      return;
    }

    // 2. Play ElevenLabs Audio if available, else fallback to standard SpeechSynthesis
    if (voiceAudioUrl) {
      const audio = new Audio(voiceAudioUrl);
      audioRef.current = audio;
      
      audio.play().catch(err => {
        console.warn("ElevenLabs audio play block, running WebSpeech API backup:", err);
        playWebSpeechText();
      });

      audio.onended = () => {
        if (onSpeechEnd) onSpeechEnd();
      };

      // Animate simulated waveform synced with audio runtime
      const animateWaveform = () => {
        setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 26) + 4));
        animationFrameRef.current = requestAnimationFrame(animateWaveform);
      };
      animateWaveform();
    } else {
      playWebSpeechText();
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [avatarState, speakingText, voiceAudioUrl]);

  // Client-Side WebSpeech Synthesis fallback with premium settings
  const playWebSpeechText = () => {
    const utterance = new SpeechSynthesisUtterance(speakingText);
    
    // Choose premium female high-fidelity voice if available in client OS
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft Zira") || v.name.includes("Samantha")) || voices[0];
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Waveform rendering loop
    const animateWaveform = () => {
      setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 22) + 4));
      animationFrameRef.current = requestAnimationFrame(animateWaveform);
    };

    utterance.onstart = () => {
      animateWaveform();
    };

    utterance.onend = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setWaveformBars(Array(15).fill(4));
      if (onSpeechEnd) onSpeechEnd();
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      if (onSpeechEnd) onSpeechEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#121212] via-[#1E1E1E] to-[#141414] border border-black/5 dark:border-white/10 shadow-2xl flex flex-col items-center justify-center p-6 text-center group">
      {/* Mesh Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Dynamic Status Rings */}
      <div className="relative z-10 w-44 h-44 mb-8 flex items-center justify-center">
        {/* Orbiting Ring 1 (Listening/Thinking pulse) */}
        {avatarState === 'listening' && (
          <div className="absolute inset-0 rounded-full border-2 border-[#26A69A]/30 animate-ping [animation-duration:3s]" />
        )}
        {avatarState === 'thinking' && (
          <div className="absolute inset-0 rounded-full border border-dashed border-[#26A69A]/60 animate-spin [animation-duration:12s]" />
        )}

        {/* Outer Halo */}
        <div className={`absolute w-[110%] h-[110%] rounded-full transition-all duration-700 blur-xl opacity-35 ${
          avatarState === 'listening' 
          ? 'bg-[#26A69A]' 
          : avatarState === 'thinking' 
          ? 'bg-amber-500' 
          : 'bg-[#26A69A]'
        }`} />

        {/* Central Interviewer Profile */}
        <div className="w-40 h-40 bg-[#222] rounded-full border-4 border-white/5 overflow-hidden relative shadow-2xl z-10 transition-transform group-hover:scale-[1.02]">
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" 
            className="w-full h-full object-cover grayscale brightness-90 filter transition-all"
            alt="Dr. Sarah Vance Interviewer Avatar"
          />

          {/* Screen Glare and Telemetry Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/5 pointer-events-none" />
        </div>

        {/* Mini Orb Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#1E1E1E] flex items-center justify-center shadow-lg transition-colors z-20 ${
          avatarState === 'listening' 
          ? 'bg-emerald-500' 
          : avatarState === 'thinking' 
          ? 'bg-amber-500 animate-pulse' 
          : 'bg-[#26A69A]'
        }`}>
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </div>

      {/* Speaker Name Tag */}
      <div className="relative z-10 mb-4">
        <h4 className="font-bold text-white text-lg tracking-tight flex items-center justify-center gap-2">
          Dr. Sarah Vance
          <Sparkles className="w-4 h-4 text-[#26A69A]" />
        </h4>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[9px] uppercase font-black tracking-widest text-[#26A69A] bg-[#26A69A]/10 px-2 py-0.5 rounded-md">
            AI DIRECTOR
          </span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold capitalize">
            {avatarState}
          </span>
        </div>
      </div>

      {/* Speaking Text Subtitles / State Indicators */}
      <div className="relative z-10 max-w-md w-full min-h-[50px] bg-black/35 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 text-white/80 text-xs leading-relaxed font-medium">
        <AnimatePresence mode="wait">
          {avatarState === 'listening' && (
            <motion.div 
              key="listening"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-[#26A69A] font-bold uppercase tracking-wider"
            >
              <MessageSquare className="w-4 h-4 animate-bounce" />
              <span>Listening to your answer...</span>
            </motion.div>
          )}

          {avatarState === 'thinking' && (
            <motion.div 
              key="thinking"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-amber-500 font-bold uppercase tracking-wider"
            >
              <Brain className="w-4 h-4 animate-pulse" />
              <span>Analyzing response depth...</span>
            </motion.div>
          )}

          {avatarState === 'speaking' && (
            <motion.div 
              key="speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-left font-serif italic text-white/95 text-xs line-clamp-3"
            >
              "{speakingText}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Synced Lip-Sync Equalizer Waveform */}
      {avatarState === 'speaking' && (
        <div className="mt-6 flex items-center justify-center gap-1.5 h-8">
          <Volume2 className="w-4 h-4 text-[#26A69A] mr-2 opacity-70 animate-pulse" />
          {waveformBars.map((val, idx) => (
            <motion.div 
              key={idx}
              animate={{ height: `${val}px` }}
              transition={{ type: 'spring', damping: 8, stiffness: 200 }}
              className="w-1 rounded-full bg-[#26A69A]"
            />
          ))}
        </div>
      )}
    </div>
  );
};
