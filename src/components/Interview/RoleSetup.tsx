import React, { useState } from 'react';
import { 
  ChevronRight, 
  Briefcase, 
  Building2, 
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentInfo {
  name: string;
  email: string;
  college: string;
  domain: string;
  resumeContent?: string;
}

interface RoleSetupProps {
  student: StudentInfo;
  setStudent: React.Dispatch<React.SetStateAction<StudentInfo>>;
  onStart: (role: string, company: string) => void;
}

export const RoleSetup: React.FC<RoleSetupProps> = ({ student, setStudent, onStart }) => {
  const [role, setRole] = useState('software_engineer');
  const [company, setCompany] = useState('general');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roles = [
    { value: 'software_engineer', label: 'Software Engineer' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'hr_specialist', label: 'HR Specialist' },
    { value: 'sales_executive', label: 'Sales Executive' },
    { value: 'financial_analyst', label: 'Financial Analyst' },
    { value: 'marketing_coordinator', label: 'Marketing Coordinator' }
  ];

  const companies = [
    { value: 'general', label: 'General Practice Simulation' },
    { value: 'google', label: 'Google Simulation' },
    { value: 'stripe', label: 'Stripe Simulation' },
    { value: 'meta', label: 'Meta Simulation' },
    { value: 'mckinsey', label: 'McKinsey & Co. Simulation' },
    { value: 'goldman_sachs', label: 'Goldman Sachs Simulation' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-xl mx-auto bg-white dark:bg-[#1E1E1E] p-8 md:p-10 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-2xl transition-all"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black dark:bg-[#2A2A2A] text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <Briefcase className="w-8 h-8 text-[#26A69A]" />
        </div>
        <h2 className="text-3xl font-medium tracking-tight">Configure Your Interview</h2>
        <p className="text-sm text-black/50 dark:text-white/50 mt-2">Customize the AI simulation for personalized, high-caliber dynamic questions.</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold leading-relaxed">{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="text-[10px] uppercase tracking-widest font-black opacity-45 mb-2 block">Target Position</label>
          <div className="relative">
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#26A69A] transition-all appearance-none cursor-pointer pr-12 text-sm font-medium"
            >
              {roles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <Briefcase className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 opacity-35 pointer-events-none" />
          </div>
        </div>

        {/* Company Simulation */}
        <div>
          <label className="text-[10px] uppercase tracking-widest font-black opacity-45 mb-2 block">Target Company Simulation</label>
          <div className="relative">
            <select 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-[#f9f9f9] dark:bg-[#2A2A2A] border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#26A69A] transition-all appearance-none cursor-pointer pr-12 text-sm font-medium"
            >
              {companies.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Building2 className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 opacity-35 pointer-events-none" />
          </div>
        </div>
      </div>

      <button 
        onClick={() => onStart(role, company)}
        className="w-full mt-10 bg-black dark:bg-[#26A69A] text-white py-5 rounded-2xl font-bold tracking-tight transition-all flex items-center justify-center gap-3 hover:scale-[1.01] hover:bg-[#1f877d] active:scale-[0.99] shadow-xl shadow-black/5 dark:shadow-none"
      >
        <span>Initialize AI Interviewer</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
};
