/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from './hooks/useTheme';
import { Moon, Sun, Camera, Volume2, Settings, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ArrowRight, 
  BookOpen, 
  Code, 
  Brain, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Award, 
  TrendingUp,
  Loader2,
  ChevronRight,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Eye,
  Mic,
  Monitor,
  AlertTriangle,
  Lock,
  History,
  MousePointer2,
  FileUp,
  Check
} from 'lucide-react';
import { 
  User,
  Timer as ClockIcon,
  Send,
  MessageCircle,
  BarChart3,
  Lightbulb,
  Zap
} from 'lucide-react';

import { RoleSetup } from './components/Interview/RoleSetup';
import { InterviewRoom } from './components/Interview/InterviewRoom';
import { InterviewReport } from './components/Interview/InterviewReport';

interface MCQQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
}

interface CommQuestion {
  text: string;
}

interface DynamicQuestions {
  coding: MCQQuestion[];
  aptitude: MCQQuestion[];
  communication: CommQuestion[];
  domain: MCQQuestion[];
}

interface MonitoringEvent {
  type: 'tab_switch' | 'voice_alert' | 'fullscreen_exit' | 'copy_paste' | 'face_missing';
  timestamp: string;
  description: string;
}

type Page = 'home' | 'info' | 'assessment' | 'results' | 'interview' | 'interview_results';
type AssessmentStep = 'coding' | 'aptitude' | 'communication' | 'domain';

interface StudentInfo {
  name: string;
  email: string;
  college: string;
  domain: string;
  resumeContent?: string;
}

interface AssessmentState {
  coding: number[];
  aptitude: number[];
  communication: { q1: string; q2: string };
  domain: number[];
}

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [page, setPage] = useState<Page>('home');
  const [student, setStudent] = useState<StudentInfo>({
    name: '',
    email: '',
    college: '',
    domain: 'web_dev',
    resumeContent: ''
  });
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [step, setStep] = useState<AssessmentStep>('coding');
  const [answers, setAnswers] = useState<AssessmentState>({
    coding: Array(5).fill(-1),
    aptitude: Array(5).fill(-1),
    communication: { q1: '', q2: '' },
    domain: Array(5).fill(-1)
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestions | null>(null);
  const [unlockedModules, setUnlockedModules] = useState<string[]>(['coding']);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ tips: string[]; recommendations: string[] } | null>(null);

  // Interview State
  const [interviewSessionId, setInterviewSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewEval, setInterviewEval] = useState<any | null>(null);
  const [interviewTime, setInterviewTime] = useState(0);
  const [interviewRole, setInterviewRole] = useState('software_engineer');
  const [interviewCompany, setInterviewCompany] = useState('general');
  const [interviewStep, setInterviewStep] = useState<'setup' | 'live'>('setup');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Monitoring State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [integrityLog, setIntegrityLog] = useState<MonitoringEvent[]>([]);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [voiceAlerts, setVoiceAlerts] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isExamFlagged, setIsExamFlagged] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [isSessionBlocked, setIsSessionBlocked] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');

  // Audio/Video Device Testing States
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [micTestVolume, setMicTestVolume] = useState<number>(0);
  const [micTestActive, setMicTestActive] = useState<boolean>(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const testStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load available input devices
  const loadDevices = async () => {
    try {
      // Trigger temporary permission request to enumerate device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      tempStream.getTracks().forEach(t => t.stop());
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      const cams = devices.filter(d => d.kind === 'videoinput');
      setAudioDevices(mics);
      setVideoDevices(cams);
      
      if (mics.length > 0) {
        setSelectedMicId(prev => prev || mics[0].deviceId);
      }
      if (cams.length > 0) {
        setSelectedCameraId(prev => prev || cams[0].deviceId);
      }
      setMicPermissionError(null);
    } catch (err: any) {
      console.error("Device access denied or failed:", err);
      setMicPermissionError("Microphone/Camera access not detected or permission denied. Please check browser settings.");
    }
  };

  useEffect(() => {
    if (page === 'info') {
      loadDevices();
    }
    return () => {
      stopMicTest();
    };
  }, [page]);

  // Start Mic testing visualizer
  const startMicTest = async () => {
    if (micTestActive) {
      stopMicTest();
      return;
    }
    
    setMicTestActive(true);
    setMicPermissionError(null);
    try {
      const constraints = {
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
        video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;
      
      // Setup Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / bufferLength;
        // Map volume to a 0-100 scale (Web Audio API outputs 0-255 generally)
        const mappedVolume = Math.min(100, Math.round((average / 128) * 100));
        setMicTestVolume(mappedVolume);
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error("Failed to start mic test:", err);
      setMicPermissionError("Microphone not detected, please check settings.");
      setMicTestActive(false);
    }
  };

  const stopMicTest = () => {
    setMicTestActive(false);
    setMicTestVolume(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop());
      testStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const terminateSession = async (reason: string) => {
    if (isSessionBlocked) return;
    
    setIsSessionBlocked(true);
    setTerminationReason(reason);
    setMicActive(false);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      if (page === 'interview' && interviewSessionId) {
        await fetch('/api/interview/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: interviewSessionId, reason })
        });
      } else if (page === 'assessment') {
        await fetch('/api/assessment/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student, reason })
        });
      }
    } catch (error) {
      console.error("Termination failed to log", error);
    }
  };

  const logEvent = (type: MonitoringEvent['type'], description: string) => {
    const newEvent: MonitoringEvent = {
      type,
      description,
      timestamp: new Date().toLocaleTimeString()
    };
    setIntegrityLog(prev => [...prev.slice(-19), newEvent]); // Keep last 20 events
    
    if (type === 'tab_switch') setTabSwitches(prev => prev + 1);
    
    if (type === 'voice_alert') {
      setVoiceAlerts(prev => {
        const next = prev + 1;
        if (next === 1) {
          setShowWarning("Warning: Suspicious voice activity detected. Please maintain silence.");
        } else if (next === 2) {
          setShowWarning("Marked Suspicious: Continuous conversation or external prompting detected.");
        } else if (next >= 3) {
          setShowWarning("CRITICAL: Exam has been auto-flagged for review due to multiple voice violations.");
          setIsExamFlagged(true);
        }
        return next;
      });
    } else {
      setShowWarning(`Monitoring Alert: ${description}`);
    }
    
    setTimeout(() => setShowWarning(null), 4000);
  };

  const startMonitoring = async () => {
    try {
      const constraints = {
        video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setWebcamEnabled(true);
      setMicActive(true);
      
      // Log active device info to console for debugging
      console.log(`[Proctoring] Started camera/mic monitoring. Mic: ${selectedMicId || 'default'}, Cam: ${selectedCameraId || 'default'}`);

      // Post monitoring start to the backend
      fetch('/api/assessment/proctor-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          event: 'monitoring_started',
          metadata: { selectedMicId, selectedCameraId }
        })
      }).catch(err => console.error("Logging proctor event failed:", err));

      // Fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }

      // Advanced Voice Detection using Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            logEvent('voice_alert', `Speech detected: "${lastResult[0].transcript.substring(0, 30)}..."`);
          }
        };

        recognition.onend = () => {
          if (page === 'assessment' && micActive) recognition.start();
        };

        recognition.start();
      } else {
        // Fallback to volume detection if Speech API is unavailable
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(mediaStream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
          if (page !== 'assessment') return;
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          if (volume > 70) { 
            logEvent('voice_alert', 'Significant speech or background noise detected');
          }
          requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }

    } catch (err: any) {
      console.error("Monitoring failed to start", err);
      logEvent('face_missing', 'Could not access webcam/microphone. Check settings.');
      
      // Fallback: If exact constraint fails, try with default devices
      try {
        console.warn("[Proctoring] Chosen devices failed. Attempting default fallback.");
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(fallbackStream);
        setWebcamEnabled(true);
        setMicActive(true);
      } catch (fallbackErr) {
        console.error("Default fallback also failed:", fallbackErr);
      }
    }
  };

  // Resilient fallback on active device changes
  useEffect(() => {
    const handleDeviceChange = async () => {
      console.warn("[Proctoring Alert] Media devices changed during session.");
      
      if (page === 'assessment') {
        fetch('/api/assessment/proctor-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student,
            event: 'device_changed',
            metadata: { timestamp: new Date().toISOString() }
          })
        }).catch(() => {});
      }
      
      if (page === 'assessment' && stream) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const workingMics = devices.filter(d => d.kind === 'audioinput');
          if (workingMics.length > 0) {
            const fallbackMic = workingMics.find(m => m.deviceId !== selectedMicId) || workingMics[0];
            console.log(`[Proctoring Fallback] Swapped input to mic: ${fallbackMic.label}`);
            
            const nextStream = await navigator.mediaDevices.getUserMedia({
              video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
              audio: { deviceId: { exact: fallbackMic.deviceId } }
            });
            
            stream.getTracks().forEach(t => t.stop());
            setStream(nextStream);
            setSelectedMicId(fallbackMic.deviceId);
            
            fetch('/api/assessment/proctor-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                student,
                event: 'fallback_mic_swapped',
                metadata: { fallbackMicId: fallbackMic.deviceId }
              })
            }).catch(() => {});
          }
        } catch (fallbackError) {
          console.error("Failed to recover audio/video stream on device change:", fallbackError);
          logEvent('face_missing', 'Microphone or webcam disconnected');
        }
      }
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [page, stream, selectedMicId, selectedCameraId]);

  useEffect(() => {
    if (page === 'assessment' || page === 'interview') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          logEvent('tab_switch', 'User switched tabs or minimized browser');
          terminateSession('Tab switching detected');
        }
      };

      const handleBlur = () => {
        logEvent('tab_switch', 'Window focus lost');
        terminateSession('Focus lost (possible multi-tasking or cheating)');
      };

      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
        if (!document.fullscreenElement && (page === 'assessment' || page === 'interview')) {
          logEvent('fullscreen_exit', 'User exited fullscreen mode');
          // Optional: terminate on fullscreen exit? User didn't explicitly ask for termination on exit, 
          // but usually it's a good idea. User said "Detect tab switching, blur, or copy-paste".
        }
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        logEvent('copy_paste', 'Right-click attempted');
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) {
          e.preventDefault();
          logEvent('copy_paste', 'Copy/Paste attempted');
          terminateSession('Clipboard manipulation detected');
        }
      };

      const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        logEvent('copy_paste', 'Paste event detected');
        terminateSession('Pasting content detected');
      };

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (page === 'assessment' || page === 'interview') {
          e.preventDefault();
          e.returnValue = ''; // Required for some browsers
          terminateSession('Navigation away from session detected');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('paste', handlePaste);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('paste', handlePaste);
      };
    }
  }, [page, interviewSessionId]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsResumeUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.text) {
        setStudent(prev => ({ ...prev, resumeContent: data.text }));
      }
    } catch (error) {
      console.error("Resume upload failed", error);
    } finally {
      setIsResumeUploading(false);
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    setPage('assessment');
    startMonitoring();
    try {
      // Initialize module progress tracking on the backend
      const initResponse = await fetch('/api/progress/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: student.email,
          name: student.name
        })
      });
      const initData = await initResponse.json();
      if (initData.unlockedModules) {
        setUnlockedModules(initData.unlockedModules);
        setCompletedModules(initData.completedModules || []);
      }
    } catch (err) {
      console.error("Failed to initialize progress sequencing:", err);
    }

    try {
      const response = await fetch('/api/assessment/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: student.domain,
          email: student.email,
          name: student.name
        })
      });
      const data = await response.json();
      setDynamicQuestions(data);
    } catch (error) {
      console.error("Failed to generate questions", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (page === 'interview' && !isInterviewFinished) {
      timer = setInterval(() => {
        setInterviewTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [page, isInterviewFinished]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startInterview = () => {
    setPage('interview');
    setInterviewStep('setup');
    setInterviewSessionId(null);
    setInterviewEval(null);
    setIsInterviewFinished(false);
    setInterviewTime(0);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !interviewSessionId || isAiTyping) return;

    const userMsg = currentMessage.trim();
    setCurrentMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: interviewSessionId,
          message: userMsg
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'model', content: data.modelReply }]);
      
      if (data.isFinished) {
        setIsInterviewFinished(true);
        evaluateInterview();
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsAiTyping(false);
    }
  };

  const evaluateInterview = async () => {
    setInterviewLoading(true);
    setPage('interview_results');
    try {
      const response = await fetch('/api/interview/evaluate-conversational', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: interviewSessionId })
      });
      const data = await response.json();
      setInterviewEval(data);
    } catch (error) {
      console.error("Failed to evaluate interview", error);
    } finally {
      setInterviewLoading(false);
    }
  };

  const calculateScore = (category: 'coding' | 'aptitude' | 'domain') => {
    if (!dynamicQuestions) return 0;
    
    let score = 0;
    const questions = dynamicQuestions[category];
    
    answers[category].forEach((answer, idx) => {
      const q = questions[idx];
      if (!q) return;
      if (q.type === 'short_answer') {
        if (typeof answer === 'string' && answer.trim().length > 5) score++;
      } else {
        if (answer === q.correctAnswer) score++;
      }
    });
    return score;
  };

  const getCommunicationScore = () => {
    // Basic heuristic: check for length and keywords
    const q1Len = answers.communication.q1.length;
    const q2Len = answers.communication.q2.length;
    let score = 0;
    if (q1Len > 50) score += 4;
    else if (q1Len > 20) score += 2;
    
    if (q2Len > 50) score += 6;
    else if (q2Len > 20) score += 3;
    
    return score; // Max 10
  };

  const scores = {
    coding: calculateScore('coding'),
    aptitude: calculateScore('aptitude'),
    communication: getCommunicationScore(),
    domain: calculateScore('domain')
  };

  const totalScore = ((scores.coding / 5) + (scores.aptitude / 5) + (scores.communication / 10) + (scores.domain / 5)) / 4;
  const readiness = totalScore >= 0.8 ? 'Job Ready' : totalScore >= 0.5 ? 'Intermediate' : 'Beginner';

  const integrityScore = Math.max(0, 100 - (tabSwitches * 10) - (voiceAlerts * 5) - (integrityLog.filter(e => e.type === 'fullscreen_exit').length * 15));
  const integrityRisk = integrityScore > 80 ? 'Low Risk' : integrityScore > 50 ? 'Medium Risk' : 'High Risk';

  const fetchAISuggestions = async () => {
    setLoadingSuggestions(true);
    setMicActive(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    try {
      const response = await fetch('/api/assessment/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.name,
          scores: scores,
          performanceSummary: `Readiness level: ${readiness}. Total score average: ${(totalScore * 100).toFixed(1)}%.`
        })
      });
      const data = await response.json();
      setAiSuggestions(data);
    } catch (error) {
      console.error("Failed to fetch suggestions", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (page === 'results') {
      fetchAISuggestions();
    }
  }, [page]);

  const handleNextStep = async () => {
    try {
      const compResponse = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email, completedModule: step })
      });
      const compData = await compResponse.json();
      if (compData.unlockedModules) {
        setUnlockedModules(compData.unlockedModules);
        setCompletedModules(compData.completedModules || []);
      }
    } catch (err) {
      console.error("Failed to mark step complete on backend:", err);
    }

    if (step === 'coding') setStep('aptitude');
    else if (step === 'aptitude') setStep('communication');
    else if (step === 'communication') setStep('domain');
    else if (step === 'domain') setPage('results');
  };

  const handleSelectModule = async (target: AssessmentStep) => {
    setLockedMessage(null);
    try {
      const valResponse = await fetch('/api/progress/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email, targetModule: target })
      });
      const valData = await valResponse.json();
      if (valData.valid) {
        setStep(target);
      } else {
        setLockedMessage(valData.message || "Complete previous module to unlock.");
        setTimeout(() => setLockedMessage(null), 4000);
        if (valData.redirectModule) {
          setStep(valData.redirectModule);
        }
      }
    } catch (err) {
      console.error("Validation failed, resetting to coding:", err);
      setStep('coding');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#121212] text-[#141414] dark:text-[#E0E0E0] font-sans selection:bg-black selection:text-white transition-colors duration-300">
      <nav className="border-b border-black/5 dark:border-white/10 bg-white dark:bg-[#1E1E1E] py-4 px-6 fixed w-full top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium tracking-tight">
            <Award className="w-5 h-5 text-[#26A69A]" />
            <span className="dark:text-white">SkillAssessment</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {page !== 'home' && (
              <button
                onClick={() => {
                  setPage('home');
                  setStep('coding');
                  setAnswers({
                    coding: Array(5).fill(-1),
                    aptitude: Array(5).fill(-1),
                    communication: { q1: '', q2: '' },
                    domain: Array(5).fill(-1)
                  });
                }}
                className="text-xs uppercase tracking-widest font-semibold opacity-50 hover:opacity-100 transition-opacity dark:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold uppercase tracking-wider mb-8">
                <TrendingUp className="w-3 h-3" />
                <span>Next-Gen Talent Evaluation</span>
              </div>
              <h1 className="text-6xl font-medium tracking-tight leading-[0.9] mb-8">
                Assess Your <br /><span className="italic font-serif">Future Potential.</span>
              </h1>
              <p className="text-lg text-black/60 dark:text-white/60 mb-12">
                A comprehensive evaluation framework covering Coding, Aptitude, Communication, and Domain expertise. Get real-time feedback and AI-powered learning paths.
              </p>
              <button 
                onClick={() => setPage('info')}
                className="group relative inline-flex items-center gap-4 bg-black dark:bg-accent text-white px-8 py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="font-medium">Start Assessment</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="grid grid-cols-4 gap-4 mt-24">
                {[
                  { icon: Code, label: 'Coding' },
                  { icon: Brain, label: 'Aptitude' },
                  { icon: MessageSquare, label: 'Communication' },
                  { icon: BookOpen, label: 'Domain' }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-white dark:bg-[#1E1E1E] rounded-3xl border border-black/5 dark:border-white/10 text-center">
                    <item.icon className="w-6 h-6 mx-auto mb-4 opacity-40" />
                    <span className="text-sm font-medium tracking-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {page === 'info' && (
            <motion.div 
              key="info"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information Form */}
                <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-sm dark:shadow-black/40 flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-medium tracking-tight mb-8">Tell us about <br />yourself.</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Full Name</label>
                        <input 
                          type="text" 
                          value={student.name}
                          onChange={(e) => setStudent({...student, name: e.target.value})}
                          className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all"
                          placeholder="e.g. Alex Rivera"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Email Address</label>
                        <input 
                          type="email" 
                          value={student.email}
                          onChange={(e) => setStudent({...student, email: e.target.value})}
                          className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all"
                          placeholder="alex@university.edu"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">College / University</label>
                        <input 
                          type="text" 
                          value={student.college}
                          onChange={(e) => setStudent({...student, college: e.target.value})}
                          className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all"
                          placeholder="Tech Institute of Science"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Specialization Domain</label>
                        <select 
                          value={student.domain}
                          onChange={(e) => setStudent({...student, domain: e.target.value})}
                          className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value="web_dev">Web Development</option>
                          <option value="data_science">Data Science</option>
                          <option value="ai_ml">AI & Machine Learning</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Resume (Optional for Personalized Interview)</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept=".pdf,.txt"
                            onChange={handleResumeUpload}
                            className="hidden"
                            id="resume-upload"
                          />
                          <label 
                            htmlFor="resume-upload"
                            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                              student.resumeContent 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400' 
                              : 'bg-[#f9f9f9] dark:bg-[#2A2A2A] border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30'
                            }`}
                          >
                            {isResumeUploading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : student.resumeContent ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <FileUp className="w-5 h-5 opacity-40" />
                            )}
                            <span className="text-sm font-medium">
                              {isResumeUploading ? 'Processing...' : student.resumeContent ? 'Resume Uploaded' : 'Upload Resume (PDF/TXT)'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    disabled={!student.name || !student.email || !student.college || (audioDevices.length > 0 && !selectedMicId)}
                    onClick={fetchQuestions}
                    className="w-full mt-8 bg-black dark:bg-accent text-white py-5 rounded-2xl font-medium disabled:opacity-30 transition-all flex items-center justify-center gap-3 hover:scale-[1.01]"
                  >
                    Continue to Assessment
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Equipment & Proctoring Check Panel */}
                <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-sm dark:shadow-black/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-medium tracking-tight">Equipment Check</h2>
                      <button 
                        onClick={loadDevices}
                        className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        title="Reload devices"
                      >
                        <RefreshCw className="w-4 h-4 opacity-60" />
                      </button>
                    </div>

                    {micPermissionError && (
                      <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium leading-relaxed">{micPermissionError}</span>
                      </div>
                    )}

                    {/* Camera Preview */}
                    <div className="aspect-video bg-black rounded-2xl mb-6 relative overflow-hidden group border border-black/5 dark:border-white/10 flex items-center justify-center">
                      {micTestActive && testStreamRef.current ? (
                        <video 
                          autoPlay 
                          playsInline 
                          muted 
                          ref={(el) => { if (el && testStreamRef.current) el.srcObject = testStreamRef.current; }}
                          className="w-full h-full object-cover grayscale opacity-80"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-black/25 dark:text-white/25">
                          <Camera className="w-10 h-10" />
                          <span className="text-[10px] font-bold tracking-widest uppercase">Preview Camera Off</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
                        <div className={`w-1.5 h-1.5 rounded-full ${micTestActive ? 'bg-[#26A69A] animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[9px] uppercase tracking-wider font-bold text-white">
                          {micTestActive ? 'Testing Active' : 'System Idle'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Audio Device Dropdown */}
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Microphone Device</label>
                        <div className="relative">
                          <select 
                            value={selectedMicId}
                            onChange={(e) => {
                              setSelectedMicId(e.target.value);
                              if (micTestActive) {
                                setTimeout(startMicTest, 100);
                              }
                            }}
                            className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all appearance-none cursor-pointer pr-12 text-sm"
                          >
                            {audioDevices.length > 0 ? (
                              audioDevices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                  {d.label || `Microphone ${d.deviceId.substring(0, 5)}`}
                                </option>
                              ))
                            ) : (
                              <option value="">No Microphones Detected</option>
                            )}
                          </select>
                          <Mic className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 opacity-30" />
                        </div>
                      </div>

                      {/* Video Device Dropdown */}
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 block">Webcam Device</label>
                        <div className="relative">
                          <select 
                            value={selectedCameraId}
                            onChange={(e) => {
                              setSelectedCameraId(e.target.value);
                              if (micTestActive) {
                                setTimeout(startMicTest, 100);
                              }
                            }}
                            className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all appearance-none cursor-pointer pr-12 text-sm"
                          >
                            {videoDevices.length > 0 ? (
                              videoDevices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                  {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                                </option>
                              ))
                            ) : (
                              <option value="">No Webcams Detected</option>
                            )}
                          </select>
                          <Camera className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 opacity-30" />
                        </div>
                      </div>

                      {/* Dynamic Volume Meter */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Live Voice Input</span>
                          <span className="text-[10px] font-bold text-[#26A69A]">{micTestVolume}% Volume</span>
                        </div>
                        <div className="h-4 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-full overflow-hidden border border-black/5 dark:border-white/10 p-0.5">
                          <motion.div 
                            animate={{ width: `${micTestVolume}%` }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="h-full bg-[#26A69A] rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={startMicTest}
                    className={`w-full mt-8 py-4 rounded-xl font-semibold border transition-all text-xs uppercase tracking-widest ${
                      micTestActive 
                      ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50' 
                      : 'bg-black/5 hover:bg-black/10 text-black border-black/5 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/5'
                    }`}
                  >
                    {micTestActive ? 'Stop System Test' : 'Begin Hardware Test'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {page === 'assessment' && (
            <motion.div 
              key="assessment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="relative mb-8">
                    <Loader2 className="w-16 h-16 animate-spin text-black/10" />
                    <Sparkles className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black dark:text-white animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-medium tracking-tight mb-2 italic font-serif">Generating Fresh Content...</h2>
                  <p className="text-black/50 dark:text-white/50 max-w-xs">Our AI is crafting unique problems for your assessment to ensure a fair evaluation.</p>
                </div>
              ) : dynamicQuestions ? (
                <div className="flex flex-col xl:flex-row gap-8">
                  {/* Module Navigation & Progress Tracker (Left Column) */}
                  <div className="w-full xl:w-72 shrink-0 space-y-4">
                    <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-sm dark:shadow-black/40 sticky top-24">
                      <div className="mb-6">
                        <div className="text-[10px] uppercase tracking-widest font-black opacity-45 mb-2 block">
                          Your Progress
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-black dark:text-white">
                          Module {['coding', 'aptitude', 'communication', 'domain'].indexOf(step) + 1} of 4
                        </h3>
                        <div className="w-full bg-black/5 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                          <div 
                            className="bg-[#26A69A] h-full transition-all duration-500 ease-out rounded-full"
                            style={{ 
                              width: `${((completedModules.length) / 4) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-[10px] opacity-50 mt-1.5 block">
                          {Math.round(((completedModules.length) / 4) * 100)}% Completed
                        </span>
                      </div>

                      <hr className="border-black/5 dark:border-white/10 my-4" />

                      <div className="space-y-3">
                        {[
                          { key: 'coding', label: '1. Coding Logic', desc: 'Syntax & complex design' },
                          { key: 'aptitude', label: '2. Logical Aptitude', desc: 'Quantitative reasoning' },
                          { key: 'communication', label: '3. Communication', desc: 'Behavioral responses' },
                          { key: 'domain', label: '4. Specialization', desc: 'Specialized systems' }
                        ].map((m) => {
                          const isUnlocked = unlockedModules.includes(m.key);
                          const isCompleted = completedModules.includes(m.key);
                          const isActive = step === m.key;

                          return (
                            <button
                              key={m.key}
                              onClick={() => handleSelectModule(m.key as AssessmentStep)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                                isActive
                                  ? 'bg-black text-white border-black dark:bg-[#26A69A] dark:text-white dark:border-[#26A69A] shadow-md'
                                  : isCompleted
                                  ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                  : isUnlocked
                                  ? 'bg-[#f9f9f9] dark:bg-[#2A2A2A] border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20'
                                  : 'bg-black/5 dark:bg-white/5 border-transparent opacity-40 cursor-not-allowed'
                              }`}
                            >
                              <div>
                                <div className={`text-xs font-semibold ${isActive ? 'text-white' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-black dark:text-white'}`}>
                                  {m.label}
                                </div>
                                <div className={`text-[10px] ${isActive ? 'text-white/70' : 'opacity-40'}`}>
                                  {m.desc}
                                </div>
                              </div>
                              <div className="shrink-0 ml-2">
                                {isCompleted ? (
                                  <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                                    ✓
                                  </div>
                                ) : !isUnlocked ? (
                                  <Lock className="w-3.5 h-3.5 opacity-55 text-black dark:text-white" />
                                ) : isActive ? (
                                  <div className="w-2 h-2 rounded-full bg-white dark:bg-black animate-pulse" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-black/25 dark:bg-white/25" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    {lockedMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400"
                      >
                        <Lock className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-xs font-semibold leading-relaxed">{lockedMessage}</span>
                      </motion.div>
                    )}
                    <div className="mb-12 flex justify-between items-end">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30 mb-2">Module 0{['coding', 'aptitude', 'communication', 'domain'].indexOf(step) + 1}</div>
                        <h2 className="text-4xl font-medium tracking-tight capitalize">{step.replace('_', ' ')}</h2>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30 mb-2">Total Progress</div>
                        <div className="flex gap-1">
                          {['coding', 'aptitude', 'communication', 'domain'].map((s) => (
                            <div 
                              key={s} 
                              className={`w-8 h-1 rounded-full transition-colors ${step === s ? 'bg-black' : ['coding', 'aptitude', 'communication', 'domain'].indexOf(s) < ['coding', 'aptitude', 'communication', 'domain'].indexOf(step) ? 'bg-black/40' : 'bg-black/10 dark:bg-white/15'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {(step === 'coding' || step === 'aptitude' || step === 'domain') && (
                        dynamicQuestions[step].map((q, qIdx) => (
                          <div key={qIdx} className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm dark:shadow-black/40">
                            <div className="flex justify-between items-start gap-4 mb-6">
                              <p className="text-lg font-medium tracking-tight leading-relaxed">{qIdx + 1}. {q.text}</p>
                              <span className={`shrink-0 px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border ${
                                q.complexity === 'easy' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : q.complexity === 'hard'
                                ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                                : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                              }`}>
                                {q.complexity || 'medium'}
                              </span>
                            </div>

                            {(!q.type || q.type === 'mcq' || q.type === 'tf') ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options.map((opt, oIdx) => (
                                  <button
                                    key={oIdx}
                                    onClick={() => {
                                      const newAnswers = { ...answers };
                                      newAnswers[step][qIdx] = oIdx;
                                      setAnswers(newAnswers);
                                    }}
                                    className={`text-left px-6 py-4 rounded-xl border transition-all ${
                                      answers[step][qIdx] === oIdx 
                                      ? 'bg-black dark:bg-accent text-white border-black ring-4 ring-black/5' 
                                      : 'bg-[#f9f9f9] dark:bg-[#2A2A2A] border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30'
                                    }`}
                                  >
                                    <span className="opacity-40 text-xs mr-3">{String.fromCharCode(65 + oIdx)}</span>
                                    <span className="font-medium text-sm">{opt}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <textarea
                                  value={answers[step][qIdx] === -1 || typeof answers[step][qIdx] === 'number' ? '' : answers[step][qIdx]}
                                  onChange={(e) => {
                                    const newAnswers = { ...answers };
                                    newAnswers[step][qIdx] = e.target.value;
                                    setAnswers(newAnswers);
                                  }}
                                  className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all text-sm leading-relaxed"
                                  placeholder="Type your detailed response here..."
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {step === 'communication' && (
                        <div className="space-y-6">
                          {dynamicQuestions.communication.map((q, qIdx) => (
                            <div key={qIdx} className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-black/5 dark:border-white/10">
                              <p className="text-lg font-medium tracking-tight mb-4">{qIdx + 1}. {q.text}</p>
                              <textarea 
                                value={qIdx === 0 ? answers.communication.q1 : answers.communication.q2}
                                onChange={(e) => setAnswers({
                                  ...answers, 
                                  communication: {
                                    ...answers.communication, 
                                    [qIdx === 0 ? 'q1' : 'q2']: e.target.value
                                  }
                                })}
                                className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-accent/50 transition-all text-sm leading-relaxed"
                                placeholder="Type your response here..."
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-12 flex justify-between items-center">
                      <button 
                        onClick={() => {
                          if (stream) stream.getTracks().forEach(t => t.stop());
                          setPage('info');
                        }}
                        className="px-8 py-4 opacity-50 hover:opacity-100 font-medium transition-all"
                      >
                        Quit
                      </button>
                      <button 
                        onClick={handleNextStep}
                        className="bg-black dark:bg-accent text-white px-10 py-5 rounded-2xl font-medium flex items-center gap-3 hover:scale-[1.02] shadow-xl shadow-black/10 dark:shadow-black/50"
                      >
                        {step === 'domain' ? 'Finish Assessment' : 'Next Module'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Monitoring Sidebar */}
                  <div className="w-full lg:w-80 shrink-0 space-y-4">
                    <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm dark:shadow-black/40 sticky top-24">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest font-black opacity-40">Live Monitoring Active</span>
                      </div>
                      
                      <div className="aspect-video bg-black dark:bg-accent rounded-2xl mb-6 relative overflow-hidden group">
                        {webcamEnabled && stream ? (
                          <video 
                            autoPlay 
                            playsInline 
                            muted 
                            ref={(el) => { if (el) el.srcObject = stream; }}
                            className="w-full h-full object-cover grayscale opacity-80"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                            <Eye className="w-8 h-8" />
                            <span className="text-[10px] font-bold">RECONNECTING...</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-red-500 text-[8px] font-black text-white px-2 py-0.5 rounded tracking-tighter">REC</div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-xl">
                          <div className="flex items-center gap-2">
                            <Mic className={`w-4 h-4 ${voiceAlerts > 0 ? 'text-red-500' : 'text-emerald-500'} ${micActive ? 'animate-pulse' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Speech Monitoring</span>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded ${micActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {micActive ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-xl">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 opacity-40" />
                            <span className="text-xs font-semibold">Integrity Score</span>
                          </div>
                          <span className={`text-xs font-black ${integrityScore < 70 ? 'text-red-500' : 'text-emerald-500'}`}>{integrityScore}%</span>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-30">Active Flags</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-xl flex flex-col items-center gap-1">
                              <Monitor className="w-3 h-3 opacity-30" />
                              <span className="text-[10px] font-bold">{tabSwitches} Switches</span>
                            </div>
                            <div className="p-3 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-xl flex flex-col items-center gap-1">
                              <Mic className="w-3 h-3 opacity-30" />
                              <span className="text-[10px] font-bold">{voiceAlerts} Alerts</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border border-black/5 dark:border-white/10 rounded-2xl bg-black dark:bg-accent text-white">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] uppercase tracking-widest font-bold opacity-50">System Logs</span>
                            <History className="w-3 h-3 opacity-50" />
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {integrityLog.length === 0 ? (
                              <p className="text-[10px] opacity-30 italic">All systems clear...</p>
                            ) : (
                              integrityLog.map((log, i) => (
                                <div key={i} className="text-[9px] leading-tight flex gap-2 border-b border-white/5 pb-2">
                                  <span className="opacity-40 shrink-0">{log.timestamp}</span>
                                  <span className="font-medium text-white/80">{log.description}</span>
                                </div>
                              )).reverse()
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-black/50 dark:text-white/50">Error generating questions. Please try again.</p>
                  <button onClick={fetchQuestions} className="mt-4 text-black dark:text-white font-semibold underline">Retry</button>
                </div>
              )}
            </motion.div>
          )}

          {page === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto pb-24"
            >
              <div className="text-center mb-16">
                <div className="w-20 h-20 bg-black dark:bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-6 scale-110 shadow-2xl">
                  <Award className="w-10 h-10" />
                </div>
                <h2 className="text-5xl font-medium tracking-tight mb-3">Great work, {student.name.split(' ')[0]}!</h2>
                <p className="text-black/50 dark:text-white/50 text-lg">Your skill assessment is complete. Here is your detailed analysis.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="col-span-1 md:col-span-2 bg-black dark:bg-accent text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2 block">Readiness Level</span>
                    <h3 className="text-6xl font-medium tracking-tighter mb-4 italic font-serif ">{readiness}</h3>
                    <div className="h-2 w-full bg-white dark:bg-[#1E1E1E]/10 rounded-full mt-6 mb-8 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${totalScore * 100}%` }}
                        className="h-full bg-white dark:bg-[#1E1E1E]" 
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium opacity-60">
                      <span>Overall Match Score</span>
                      <span>{(totalScore * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white dark:bg-[#1E1E1E]/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-[3rem] border border-black/5 dark:border-white/10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-3 h-3 opacity-40" />
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Integrity Report</span>
                  </div>
                  <div className="mb-6">
                    <h4 className={`text-3xl font-black italic font-serif tracking-tighter ${isExamFlagged ? 'text-red-600' : ''}`}>
                      {isExamFlagged ? 'EXAM FLAGGED' : integrityRisk}
                    </h4>
                    <p className="text-[10px] font-bold opacity-30 mt-1 uppercase leading-tight">
                      {isExamFlagged ? 'Multiple Violations Detected' : `Cheating Probability: ${100 - integrityScore}%`}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3 h-3 opacity-30" />
                        <span className="text-xs font-medium">Tab Switches</span>
                      </div>
                      <span className="text-xs font-bold">{tabSwitches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mic className="w-3 h-3 opacity-30" />
                        <span className="text-xs font-medium">Voice Alerts</span>
                      </div>
                      <span className="text-xs font-bold">{voiceAlerts}</span>
                    </div>
                    <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between font-bold text-xs">
                      <span>Final Score</span>
                      <span>{integrityScore}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="col-span-1 md:col-span-3 bg-white dark:bg-[#1E1E1E] p-8 rounded-[3rem] border border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h3 className="text-xl font-medium">Suspicious Activity Dashboard</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="text-[10px] uppercase tracking-widest font-bold opacity-40">Incident Log ({integrityLog.length})</h5>
                      <div className="max-h-60 overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                        {integrityLog.length === 0 ? (
                          <div className="p-6 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                            <p className="text-xs font-medium text-emerald-700">Perfect Integrity! <br />No suspicious events recorded.</p>
                          </div>
                        ) : (
                          integrityLog.map((log, idx) => (
                            <div key={idx} className="p-4 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-2xl flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1E1E1E] flex items-center justify-center shrink-0 shadow-sm dark:shadow-black/40">
                                {log.type === 'tab_switch' && <Monitor className="w-4 h-4 opacity-40" />}
                                {log.type === 'voice_alert' && <Mic className="w-4 h-4 opacity-40" />}
                                {log.type === 'copy_paste' && <MousePointer2 className="w-4 h-4 opacity-40" />}
                                {log.type === 'fullscreen_exit' && <AlertTriangle className="w-4 h-4 opacity-40" />}
                              </div>
                              <div>
                                <div className="text-[10px] font-black opacity-30 uppercase">{log.timestamp} • {log.type.replace('_', ' ')}</div>
                                <p className="text-xs font-semibold leading-relaxed text-black/70 dark:text-white/70">{log.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="bg-[#f9f9f9] dark:bg-[#2A2A2A] p-6 rounded-[2.5rem] flex flex-col justify-center">
                      <h5 className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-6 italic">Integrity Summary</h5>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${tabSwitches > 3 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <div>
                            <p className="text-xs font-bold leading-none mb-1">Tab Stability</p>
                            <p className="text-[10px] opacity-40 font-medium">Candidate stayed on task {100 - (tabSwitches * 5)}% of the time.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${voiceAlerts > 5 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <div>
                            <p className="text-xs font-bold leading-none mb-1">Environment Noise</p>
                            <p className="text-[10px] opacity-40 font-medium">External voice detection within acceptable bounds.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${integrityLog.filter(e => e.type === 'copy_paste').length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <div>
                            <p className="text-xs font-bold leading-none mb-1">Direct Manipulations</p>
                            <p className="text-[10px] opacity-40 font-medium">Attempted clipboard or right-click access detected.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-medium tracking-tight mb-6 px-4">Performance Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {[
                  { label: 'Coding', score: scores.coding, total: 5, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Aptitude', score: scores.aptitude, total: 5, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Comm.', score: scores.communication, total: 10, color: 'bg-orange-50 text-orange-700' },
                  { label: 'Domain', score: scores.domain, total: 5, color: 'bg-purple-50 text-purple-700' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-black/5 dark:border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold opacity-30 uppercase tracking-widest mb-1">{item.label}</span>
                    <div className="text-4xl font-serif font-black tracking-tighter mb-2">{item.score}<span className="text-sm opacity-20 ml-1">/ {item.total}</span></div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.color}`}>
                      {((item.score / item.total) * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-[3rem] border border-black/5 dark:border-white/10">
                  <h4 className="text-xl font-medium mb-8 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-4">
                    {scores.coding >= 4 && <li className="text-sm text-black/70 dark:text-white/70 flex gap-3"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></span>Foundational coding logic is strong.</li>}
                    {scores.aptitude >= 4 && <li className="text-sm text-black/70 dark:text-white/70 flex gap-3"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></span>Excellent problem-solving and analytical speed.</li>}
                    {scores.communication >= 8 && <li className="text-sm text-black/70 dark:text-white/70 flex gap-3"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></span>High level of professional articulation.</li>}
                    {scores.domain >= 4 && <li className="text-sm text-black/70 dark:text-white/70 flex gap-3"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></span>Strong core knowledge in chosen domain.</li>}
                    {Object.values(scores).every(v => v < 4) && <li className="text-sm text-black/40 dark:text-white/40 italic">In-depth analysis pending based on detailed responses.</li>}
                  </ul>
                </div>

                <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-[3rem] border border-black/5 dark:border-white/10">
                  <h4 className="text-xl font-medium mb-8 flex items-center gap-3">
                    <Loader2 className={`w-5 h-5 ${loadingSuggestions ? 'animate-spin text-orange-500' : 'text-orange-500'}`} />
                    AI Intelligence Report
                  </h4>
                  {loadingSuggestions ? (
                    <div className="h-32 flex flex-col items-center justify-center gap-4 text-black/30 dark:text-white/30">
                      <Loader2 className="w-10 h-10 animate-spin" />
                      <p className="text-sm font-medium">Generating your custom roadmap...</p>
                    </div>
                  ) : aiSuggestions ? (
                    <div className="space-y-6">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 mb-3 block">Improvement Tips</span>
                        <ul className="space-y-2">
                          {aiSuggestions.tips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-black/70 dark:text-white/70 leading-relaxed">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 mb-3 block">Recommended Learning</span>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.recommendations.map((rec, idx) => (
                            <span key={idx} className="px-3 py-2 bg-[#f5f5f5] rounded-xl text-[11px] font-semibold text-black/60 dark:text-white/60 capitalize">
                              {rec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-black/30 dark:text-white/30 italic">Detailed roadmap could not be generated. Review your module scores above.</p>
                  )}
                </div>
              </div>

              <div className="mt-16 text-center flex flex-col md:flex-row gap-4 justify-center">
                <button 
                  onClick={startInterview}
                  className="bg-black dark:bg-accent text-white px-12 py-5 rounded-2xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 dark:shadow-black/50 flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  Start Mock Interview
                </button>
                <button 
                  onClick={() => setPage('home')}
                  className="bg-white dark:bg-[#1E1E1E] text-black dark:text-white border border-black/5 dark:border-white/10 px-12 py-5 rounded-2xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Start New Assessment
                </button>
              </div>
            </motion.div>
          )}

          {page === 'interview' && (
            <motion.div 
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              {interviewStep === 'setup' ? (
                <RoleSetup 
                  student={student}
                  setStudent={setStudent}
                  onStart={(selectedRole, selectedCompany) => {
                    setInterviewRole(selectedRole);
                    setInterviewCompany(selectedCompany);
                    setInterviewStep('live');
                  }}
                />
              ) : (
                <InterviewRoom 
                  student={student}
                  role={interviewRole}
                  company={interviewCompany}
                  scores={scores}
                  readiness={readiness}
                  onFinish={async (sessId) => {
                    setInterviewSessionId(sessId);
                    setInterviewLoading(true);
                    setPage('interview_results');
                    try {
                      const response = await fetch('/api/interview/evaluate-conversational', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: sessId })
                      });
                      const data = await response.json();
                      setInterviewEval(data);
                    } catch (error) {
                      console.error("Failed to evaluate interview", error);
                    } finally {
                      setInterviewLoading(false);
                    }
                  }}
                  onExit={() => setPage('results')}
                />
              )}
            </motion.div>
          )}

          {page === 'interview_results' && (
            <motion.div 
              key="interview_results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto pb-24"
            >
              {interviewLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="relative mb-12">
                    <Loader2 className="w-24 h-24 animate-spin text-black/5 dark:text-white/5" />
                    <Zap className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black dark:text-white animate-pulse" />
                  </div>
                  <h2 className="text-4xl font-medium tracking-tight mb-4 italic font-serif">Analyzing Your Answers...</h2>
                  <p className="text-black/50 dark:text-white/50 max-w-sm mx-auto">Our AI Interviewer is evaluating your technical depth, vocal confidence, and behavioral metrics to synthesize your performance scorecard.</p>
                </div>
              ) : interviewEval ? (
                <InterviewReport 
                  reportData={interviewEval}
                  studentName={student.name}
                  role={interviewRole}
                  onRestart={() => {
                    setPage('home');
                    setStudent({
                      name: '',
                      email: '',
                      college: '',
                      domain: 'web_dev',
                      resumeContent: ''
                    });
                  }}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Termination Modal */}
      <AnimatePresence>
        {isSessionBlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-white dark:bg-[#1E1E1E] rounded-[3rem] p-10 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-medium tracking-tight mb-4">Session Terminated</h2>
              <p className="text-black/50 dark:text-white/50 mb-8 leading-relaxed">
                Your activity has been flagged for a violation of the integrity policy: <br />
                <span className="text-red-600 font-bold italic">"{terminationReason}"</span>
              </p>
              <div className="p-6 bg-red-50 rounded-2xl mb-8 border border-red-100">
                <p className="text-xs text-red-800 font-medium">This attempt has been logged and reported for administrative review. You cannot resume this session.</p>
              </div>
              <button 
                onClick={() => {
                  setPage('home');
                  setIsSessionBlocked(false);
                  setStudent({
                    name: '',
                    email: '',
                    college: '',
                    domain: 'web_dev',
                    resumeContent: ''
                  });
                }}
                className="w-full bg-black dark:bg-accent text-white py-5 rounded-2xl font-bold tracking-tight hover:scale-105 active:scale-95 transition-all"
              >
                Return to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-black/5 dark:border-white/10 text-center text-[10px] uppercase tracking-[0.3em] font-bold opacity-20">
        © 2026 SkillAssessment MVP • Built for Excellence
      </footer>

      {/* Warning Overlay */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-semibold tracking-tight"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>{showWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
