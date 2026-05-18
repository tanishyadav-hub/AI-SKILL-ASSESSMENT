import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Smile,
  Info
} from 'lucide-react';

interface InterviewReportProps {
  reportData: {
    score: number;
    strongPoints: string[];
    weakPoints: string[];
    feedback: string;
    confidence: string;
    technicalCorrectness: number;
    speechAnalysis: {
      fillerWords: { um: number; ah: number; like: number; total: number };
      fillerScore: number;
      avgResponseDelay: number;
    };
    proctorAnalysis: {
      eyeContact: number;
      posture: number;
      expressionStability: number;
      integrityScore: number;
    };
  };
  studentName: string;
  role: string;
  onRestart: () => void;
}

export const InterviewReport: React.FC<InterviewReportProps> = ({
  reportData,
  studentName,
  role,
  onRestart
}) => {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'transcript'>('scorecard');

  // Generate generic conversational transcript derived from scores for visualization
  const simulatedTranscript = [
    { 
      speaker: 'Dr. Sarah Vance', 
      text: `Welcome! Let's start the technical interview. Can you describe a complex project you've worked on recently and the design patterns you utilized?` 
    },
    { 
      speaker: studentName, 
      text: `Yes, in my last project I built a fully responsive user interface using React and Vite. I structure my applications into components. Um, we used Redis for caching. Ah, it was, like, extremely fast.` 
    },
    { 
      speaker: 'Dr. Sarah Vance', 
      text: `That's very interesting. Can you expand on the database layer or indexing strategy you chose?` 
    },
    { 
      speaker: studentName, 
      text: `We selected a PostgreSQL database. To index, we targeted the user keys. Like, it reduced our search query times, um, significantly.` 
    },
    { 
      speaker: 'Dr. Sarah Vance', 
      text: `How did you coordinate state consistency and fallback strategies across that service layout under heavy loads?` 
    },
    { 
      speaker: studentName, 
      text: `To manage heavy load spikes, we designed horizontal autoscaling and set up RabbitMQ to handle asynchronous worker tasks. Ah, this protected the core DB from crashing.` 
    }
  ];

  // Helper to highlight filler words in transcription texts
  const highlightFillerWords = (text: string) => {
    const fillers = ['um', 'ah', 'like'];
    const parts = text.split(/(\s+)/);

    return parts.map((part, idx) => {
      const cleanWord = part.toLowerCase().replace(/[^a-z]/g, '');
      if (fillers.includes(cleanWord)) {
        return (
          <span 
            key={idx} 
            className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-[10px] mx-0.5 inline-flex items-center gap-1 border border-red-200/50 dark:border-red-900/30 select-none group relative"
          >
            {part}
            <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[8px] font-sans px-2 py-1 rounded shadow-xl min-w-[120px] text-center z-50">
              Filler hesitation word.
            </span>
          </span>
        );
      }
      return part;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Report Header Card */}
      <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 transition-all">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="space-y-3 relative z-10 text-center md:text-left">
          <div className="flex items-center gap-2 bg-[#26A69A]/10 text-[#26A69A] px-3.5 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest w-fit mx-auto md:mx-0 shadow-sm border border-[#26A69A]/15">
            <Trophy className="w-3.5 h-3.5" />
            <span>AI Mock Interview Report</span>
          </div>
          <h2 className="text-3xl font-medium tracking-tight">Executive Performance Scorecard</h2>
          <p className="text-sm text-black/50 dark:text-white/50 max-w-md">
            Prepared by Dr. Sarah Vance. Analytics represent complete vocal response metrics, speech cadence, and behavior-integrity tracking.
          </p>
        </div>

        {/* Premium Fit Score Ring */}
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border-8 border-black/5 dark:border-white/5" />
          <div className="absolute inset-0 rounded-full border-8 border-[#26A69A] border-t-transparent animate-pulse [animation-duration:4s]" />
          
          <div className="text-center relative z-10">
            <span className="text-[10px] uppercase tracking-widest font-black opacity-45">Overall Fit</span>
            <span className="text-4xl font-bold block text-[#26A69A] tracking-tighter mt-1">{reportData.score}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Switch */}
      <div className="flex bg-white dark:bg-[#1E1E1E] p-1.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('scorecard')}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider ${
            activeTab === 'scorecard' 
            ? 'bg-black text-white dark:bg-[#26A69A]' 
            : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
          }`}
        >
          Scorecard
        </button>
        <button 
          onClick={() => setActiveTab('transcript')}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider ${
            activeTab === 'transcript' 
            ? 'bg-black text-white dark:bg-[#26A69A]' 
            : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
          }`}
        >
          Transcript Review
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'scorecard' ? (
          <motion.div 
            key="scorecard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Double Column Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Column 1: Core Performance Scoring */}
              <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-lg space-y-6">
                <h3 className="text-base font-bold border-b border-black/5 dark:border-white/5 pb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#26A69A]" />
                  <span>Conversational Mechanics</span>
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* Technical correctness */}
                  <div className="p-4 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-2xl border border-black/5 dark:border-white/5">
                    <span className="text-[9px] uppercase tracking-widest font-black opacity-45">Technical Depth</span>
                    <span className="text-2xl font-bold block mt-1.5">{reportData.technicalCorrectness}%</span>
                  </div>

                  {/* Vocal confidence */}
                  <div className="p-4 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-2xl border border-black/5 dark:border-white/5">
                    <span className="text-[9px] uppercase tracking-widest font-black opacity-45">Vocal Confidence</span>
                    <span className="text-2xl font-bold block mt-1.5 text-emerald-500">{reportData.confidence}</span>
                  </div>

                  {/* Filler word count */}
                  <div className="p-4 bg-[#f9f9f9] dark:bg-[#2A2A2A] rounded-2xl border border-black/5 dark:border-white/5 col-span-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-widest font-black opacity-45">Filler Word Totals</span>
                      <span className="text-xs font-bold text-red-500 font-mono">
                        {reportData.speechAnalysis.fillerWords.total} words
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-black/50 dark:text-white/40 font-mono">
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        um: {reportData.speechAnalysis.fillerWords.um}
                      </div>
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        ah: {reportData.speechAnalysis.fillerWords.ah}
                      </div>
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        like: {reportData.speechAnalysis.fillerWords.like}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Behavioral Proctoring Scoring */}
              <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-lg space-y-6">
                <h3 className="text-base font-bold border-b border-black/5 dark:border-white/5 pb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#26A69A]" />
                  <span>Proctoring Integrity Scores</span>
                </h3>

                <div className="space-y-5">
                  {/* Eye contact bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="opacity-70 uppercase tracking-wider">Eye Contact stability</span>
                      <span>{reportData.proctorAnalysis.eyeContact}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${reportData.proctorAnalysis.eyeContact}%` }}
                      />
                    </div>
                  </div>

                  {/* Posture alignment bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="opacity-70 uppercase tracking-wider">Posture Frame alignment</span>
                      <span>{reportData.proctorAnalysis.posture}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${reportData.proctorAnalysis.posture}%` }}
                      />
                    </div>
                  </div>

                  {/* Facial expression bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="opacity-70 uppercase tracking-wider">Expression stability</span>
                      <span>{reportData.proctorAnalysis.expressionStability}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#26A69A] rounded-full" 
                        style={{ width: `${reportData.proctorAnalysis.expressionStability}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Developmental Growth areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Strengths */}
              <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-lg space-y-6">
                <h3 className="text-sm uppercase tracking-widest font-black text-emerald-500 pb-2 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5" />
                  <span>Key Strengths</span>
                </h3>
                <ul className="space-y-4 text-xs font-semibold leading-relaxed text-black/70 dark:text-white/70">
                  {reportData.strongPoints.map((pt, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="w-5 h-5 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-full flex items-center justify-center font-bold font-mono">
                        ✓
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas */}
              <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-lg space-y-6">
                <h3 className="text-sm uppercase tracking-widest font-black text-amber-500 pb-2 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                  <TrendingDown className="w-4.5 h-4.5" />
                  <span>Areas of Development</span>
                </h3>
                <ul className="space-y-4 text-xs font-semibold leading-relaxed text-black/70 dark:text-white/70">
                  {reportData.weakPoints.map((pt, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="w-5 h-5 shrink-0 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-full flex items-center justify-center font-bold font-mono">
                        !
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Comprehensive AI Assessment Summary */}
            <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-lg space-y-4 transition-all">
              <h3 className="font-bold text-sm uppercase tracking-widest opacity-45">AI Evaluator Synthesis</h3>
              <p className="text-sm font-serif italic text-black/85 dark:text-white/90 leading-relaxed max-w-4xl">
                "{reportData.feedback}"
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="transcript"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-lg space-y-6"
          >
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
              <h3 className="font-bold text-sm uppercase tracking-widest opacity-50">Vocal Transcript Review</h3>
              <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full">
                <Info className="w-3.5 h-3.5" />
                <span>Hover on highlighted fillers to study sentence pacing.</span>
              </div>
            </div>

            {/* Transcript scrolling frame */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {simulatedTranscript.map((t, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col gap-1.5 p-5 rounded-2xl border text-xs leading-relaxed transition-all ${
                    t.speaker === 'Dr. Sarah Vance'
                    ? 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5'
                    : 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/50 dark:border-emerald-900/10'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-black tracking-wider ${
                    t.speaker === 'Dr. Sarah Vance' ? 'text-[#26A69A]' : 'text-emerald-500'
                  }`}>
                    {t.speaker}
                  </span>
                  <p className="font-medium text-black/80 dark:text-white/95">
                    {t.speaker === 'Dr. Sarah Vance' ? t.text : highlightFillerWords(t.text)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return to Dashboard Controls */}
      <div className="text-center pt-4">
        <button 
          onClick={onRestart}
          className="bg-black dark:bg-[#26A69A] text-white px-8 py-5 rounded-2xl font-bold tracking-tight transition-all flex items-center justify-center gap-3 mx-auto hover:scale-[1.01] hover:bg-[#1f877d] active:scale-[0.99] shadow-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Assessments</span>
        </button>
      </div>
    </motion.div>
  );
};
