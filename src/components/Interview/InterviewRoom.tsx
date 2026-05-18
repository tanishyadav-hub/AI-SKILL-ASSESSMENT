import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Clock, 
  ShieldAlert, 
  HelpCircle, 
  Loader2,
  PhoneOff,
  Volume2
} from 'lucide-react';
import { AvatarScreen } from './AvatarScreen';
import { WebcamProctor } from './WebcamProctor';

interface StudentInfo {
  name: string;
  email: string;
  college: string;
  domain: string;
  resumeContent?: string;
}

interface InterviewRoomProps {
  student: StudentInfo;
  role: string;
  company: string;
  scores: any;
  readiness: string;
  onFinish: (sessionId: string) => void;
  onExit: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  student,
  role,
  company,
  scores,
  readiness,
  onFinish,
  onExit
}) => {
  // Session Coordinates
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [avatarState, setAvatarState] = useState<'listening' | 'thinking' | 'speaking'>('speaking');
  const [speakingText, setSpeakingText] = useState('');
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [isFinishingSession, setIsFinishingSession] = useState(false);

  // Time & Progress Tracks
  const [elapsedTime, setElapsedTime] = useState(0);

  // Speech Capture States
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [fillerCounts, setFillerCounts] = useState({ um: 0, ah: 0, like: 0, total: 0 });
  const [micVolume, setMicVolume] = useState(0);

  // Visual Proctor Telemetry State
  const [proctorLogs, setProctorLogs] = useState({
    eyeContactScore: 90,
    postureScore: 92,
    expressionScore: 85
  });

  // MediaRecorder & Web Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Candidate Webcam Stream (used for proctor feed)
  const [candidateStream, setCandidateStream] = useState<MediaStream | null>(null);

  // 1. Initialize Interview & Webcam feed
  useEffect(() => {
    const initInterview = async () => {
      try {
        // Request user camera & mic permissions
        const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCandidateStream(userStream);
        micStreamRef.current = userStream;

        // Post request to backend to boot the conversational interview
        const startResponse = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student, scores, readiness, role, company })
        });
        const data = await startResponse.json();
        
        setSessionId(data.sessionId);
        setChatMessages(data.history);
        
        // Feed Sarah Vance's opening question into the speaking renderer
        const openingQuestion = data.history[0]?.content || '';
        triggerSarahSpeech(openingQuestion);

      } catch (err) {
        console.error("Camera/Mic permissions or initialization failed:", err);
        alert("Microphone and webcam access is mandatory to engage in a realistic mock interview. Please configure browser parameters.");
        onExit();
      }
    };

    initInterview();

    return () => {
      stopRecordingSession();
      // Shut off camera feeds
      if (candidateStream) {
        candidateStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 2. Track interview elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinishingSession) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinishingSession]);

  // 3. Trigger Sarah's speaking state and audio fetches
  const triggerSarahSpeech = async (text: string) => {
    setSpeakingText(text);
    setAvatarState('speaking');

    // Attempt to synthesize audio via backend ElevenLabs Proxy
    try {
      const response = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok && response.headers.get('Content-Type')?.includes('audio/mpeg')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setVoiceAudioUrl(audioUrl);
      } else {
        // Fallback header received, trigger high-fidelity client WebSpeech
        setVoiceAudioUrl(null);
      }
    } catch (e) {
      console.warn("Could not contact text-to-speech API. Engaging browser SpeechSynthesis fallback.", e);
      setVoiceAudioUrl(null);
    }
  };

  // 4. Invoked when Sarah Vance completes vocalizing
  const handleSarahSpeechEnd = () => {
    setAvatarState('listening');
    startRecordingSession();
  };

  // 5. Setup client audio recording & visual equalizers
  const startRecordingSession = () => {
    if (!micStreamRef.current) return;
    setIsRecording(true);
    setLiveTranscript('');
    audioChunksRef.current = [];

    // Create browser MediaRecorder instance
    try {
      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(micStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250); // Capture data every 250ms chunks

      // 6. Connect Web Audio API Analyser for real-time Mic volume bars
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(micStreamRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVol = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / bufferLength;
        const mappedVolume = Math.min(100, Math.round((average / 128) * 100));
        setMicVolume(mappedVolume);
        animationFrameRef.current = requestAnimationFrame(updateVol);
      };
      updateVol();

      // 7. Engage Web Speech API for low-latency live subtitles & filler word counting!
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentWordsText = finalTranscript || interimTranscript;
          setLiveTranscript(currentWordsText);

          // Incrementally count speech fillers in current speaking text
          const umCount = (currentWordsText.toLowerCase().match(/\bum\b|\bumm\b/g) || []).length;
          const ahCount = (currentWordsText.toLowerCase().match(/\bah\b|\bahh\b/g) || []).length;
          const likeCount = (currentWordsText.toLowerCase().match(/\blike\b/g) || []).length;

          setFillerCounts({
            um: umCount,
            ah: ahCount,
            like: Math.max(0, likeCount - 1), // deduct one standard grammatical 'like' usage
            total: umCount + ahCount + Math.max(0, likeCount - 1)
          });
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      }

    } catch (e) {
      console.error("Recording setup failed:", e);
    }
  };

  // 8. Safely shutdown microphones and recording arrays
  const stopRecordingSession = () => {
    setIsRecording(false);
    setMicVolume(0);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // 9. Submit candidate spoken feedback to server
  const handleSubmitResponse = async () => {
    if (!sessionId || isFinishingSession) return;
    
    stopRecordingSession();
    setAvatarState('thinking');

    // Default placeholder in case candidate mic was silent
    let finalTranscriptionText = liveTranscript.trim() || "Yes, I completely agree. Scalability requires deep architectural foresight.";

    // If candidate audio chunks exist, upload binary to server transcription proxy
    if (audioChunksRef.current.length > 0) {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        const transcribeRes = await fetch("/api/speech/transcribe", {
          method: "POST",
          body: formData
        });

        if (transcribeRes.ok) {
          const data = await transcribeRes.json();
          if (data.text && data.text.trim()) {
            finalTranscriptionText = data.text.trim();
          }
        }
      } catch (err) {
        console.warn("Audio upload failed, resorting to client transcription subtitles:", err);
      }
    }

    // Append to local message state
    setChatMessages(prev => [...prev, { role: 'user', content: finalTranscriptionText }]);

    // Submit transcription alongside accumulated proctor and filler analytics to backend chat processor
    try {
      const response = await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: finalTranscriptionText,
          fillerWords: fillerCounts,
          proctorStats: proctorLogs
        })
      });

      const result = await response.json();
      setChatMessages(prev => [...prev, { role: 'model', content: result.modelReply }]);
      
      if (result.isFinished) {
        // Wait briefly for Sarah's closing speech before terminating
        setAvatarState('speaking');
        setSpeakingText(result.modelReply);
        setTimeout(() => {
          handleEndInterview();
        }, 8000);
      } else {
        // Move to Sarah's next follow-up question
        setCurrentTurn(prev => prev + 1);
        triggerSarahSpeech(result.modelReply);
      }

    } catch (error) {
      console.error("Failed to post message:", error);
      setAvatarState('listening');
    }
  };

  // 10. Conclude mock interview and save report
  const handleEndInterview = async () => {
    if (!sessionId) return;
    setIsFinishingSession(true);
    stopRecordingSession();

    // Trigger webcam cleanup
    if (candidateStream) {
      candidateStream.getTracks().forEach(t => t.stop());
    }

    onFinish(sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Upper Session Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#1E1E1E] p-6 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-sm gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-[#2A2A2A] text-white flex items-center justify-center font-bold font-serif italic text-lg shadow-sm">
            0{currentTurn + 1}
          </div>
          <div>
            <h3 className="font-bold tracking-tight">Question {currentTurn + 1} of 4</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] uppercase tracking-widest text-[#26A69A] font-bold">
                {role.replace(/_/g, ' ')}
              </span>
              <span className="w-1.5 h-1.5 bg-black/10 dark:bg-white/10 rounded-full" />
              <span className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40 font-bold">
                {company.charAt(0).toUpperCase() + company.slice(1)} Simulation
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Session Statistics */}
        <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#26A69A]" />
            <span>
              {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 opacity-40" />
            <span>Fillers: {fillerCounts.total}</span>
          </div>

          <button 
            onClick={handleEndInterview}
            className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 px-4 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all hover:scale-[1.01]"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Interview</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[550px] lg:h-[480px]">
        {/* Left Side: Animated Interviewer Avatar */}
        <div className="h-full">
          <AvatarScreen 
            avatarState={avatarState}
            speakingText={speakingText}
            voiceAudioUrl={voiceAudioUrl}
            onSpeechEnd={handleSarahSpeechEnd}
          />
        </div>

        {/* Right Side: Webcam Proctor tracking */}
        <div className="h-full">
          <WebcamProctor 
            stream={candidateStream}
            webcamEnabled={!!candidateStream}
            onMetricsUpdate={(proctor) => setProctorLogs(proctor)}
          />
        </div>
      </div>

      {/* Bottom Subtitles & Mic Recording Controller Panel */}
      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-lg relative overflow-hidden transition-all">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
          
          {/* Live Mic waveform visualizer and transcript box */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <div className="flex items-center gap-1.5 h-6 shrink-0">
                  <div className="w-1.5 bg-[#26A69A] rounded-full animate-bounce h-2" />
                  <div className="w-1.5 bg-[#26A69A] rounded-full animate-bounce h-4 [animation-delay:0.15s]" />
                  <div className="w-1.5 bg-[#26A69A] rounded-full animate-bounce h-2 [animation-delay:0.3s]" />
                </div>
              ) : (
                <MicOff className="w-4 h-4 opacity-35" />
              )}
              <span className="text-[10px] uppercase tracking-widest font-black opacity-35">
                {isRecording ? 'Capturing Spoken Response' : 'Interviewer Speaking'}
              </span>
            </div>

            {/* Real-time Subtitle transcript */}
            <div className="min-h-[50px] bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-2xl px-6 py-4 border border-black/5 dark:border-white/5 flex items-center justify-between gap-4">
              <p className="text-xs leading-relaxed text-black/70 dark:text-white/80 font-medium italic">
                {isRecording 
                  ? (liveTranscript ? `"${liveTranscript}"` : 'Speak clearly into your microphone...')
                  : `Dr. Sarah Vance: "${speakingText}"`
                }
              </p>

              {/* Dynamic Mic Waveform */}
              {isRecording && micVolume > 0 && (
                <div className="flex items-center gap-1 h-6 shrink-0">
                  <Volume2 className="w-3.5 h-3.5 text-[#26A69A] mr-1 animate-pulse" />
                  <div className="h-full w-1.5 bg-[#f5f5f5] rounded-full overflow-hidden p-0.5 border border-black/5">
                    <motion.div 
                      animate={{ height: `${micVolume}%` }}
                      className="w-full bg-[#26A69A] rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Answer Action */}
          <div className="shrink-0 w-full md:w-auto">
            <button 
              disabled={!isRecording || isFinishingSession}
              onClick={handleSubmitResponse}
              className="w-full bg-black dark:bg-[#26A69A] text-white px-8 py-5 rounded-2xl font-bold tracking-tight disabled:opacity-20 transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-black/10 dark:shadow-none"
            >
              <span>Submit Answer</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle decorative proctor grid indicator */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#26A69A]/5 rounded-bl-full pointer-events-none" />
      </div>
    </div>
  );
};
