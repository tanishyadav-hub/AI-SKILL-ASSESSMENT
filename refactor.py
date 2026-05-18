import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useTheme import and Moon/Sun icons
if 'import { useTheme }' not in content:
    content = content.replace("import React, { useState, useEffect, useCallback, useRef } from 'react';", 
                              "import React, { useState, useEffect, useCallback, useRef } from 'react';\nimport { useTheme } from './hooks/useTheme';\nimport { Moon, Sun } from 'lucide-react';")

# Add useTheme call inside App component
if 'const { isDark, toggleTheme } = useTheme();' not in content:
    content = content.replace("export default function App() {", 
                              "export default function App() {\n  const { isDark, toggleTheme } = useTheme();")

# Add Theme Toggle button to Navbar
nav_replacement = '''
          <div className="flex items-center gap-2 font-medium tracking-tight">
            <Award className="w-5 h-5 text-accent" />
            <span className="dark:text-white">SkillAssessment</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
'''
if 'SkillAssessment' in content and 'toggleTheme' not in content.split('SkillAssessment')[1][:200]:
    content = re.sub(r'<div className="flex items-center gap-2 font-medium tracking-tight">.*?<span>SkillAssessment</span>.*?</div>', nav_replacement, content, flags=re.DOTALL)

# Global replacements for classes
replacements = {
    'bg-[#F5F5F5]': 'bg-[#F5F5F5] dark:bg-[#121212]',
    'text-[#141414]': 'text-[#141414] dark:text-[#E0E0E0]',
    'bg-white': 'bg-white dark:bg-[#1E1E1E]',
    'border-black/5': 'border-black/5 dark:border-white/10',
    'bg-[#f9f9f9]': 'bg-[#f9f9f9] dark:bg-[#2A2A2A]',
    'bg-[#fcfcfc]': 'bg-[#fcfcfc] dark:bg-[#1A1A1A]',
    'text-black ': 'text-black dark:text-white ',
    'text-black"': 'text-black dark:text-white"',
    'bg-black ': 'bg-black dark:bg-accent ',
    'bg-black"': 'bg-black dark:bg-accent"',
    'text-black/50': 'text-black/50 dark:text-white/50',
    'text-black/40': 'text-black/40 dark:text-white/40',
    'text-black/60': 'text-black/60 dark:text-white/60',
    'text-black/70': 'text-black/70 dark:text-white/70',
    'text-black/30': 'text-black/30 dark:text-white/30',
    'bg-black/5': 'bg-black/5 dark:bg-white/10',
    'bg-black/10': 'bg-black/10 dark:bg-white/15',
    'bg-black/20': 'bg-black/20 dark:bg-white/20',
    'shadow-black/10': 'shadow-black/10 dark:shadow-black/50',
    'shadow-black/20': 'shadow-black/20 dark:shadow-black/60',
    'shadow-sm': 'shadow-sm dark:shadow-black/40',
    'hover:border-black/20': 'hover:border-black/20 dark:hover:border-white/30',
    'focus:ring-black/5': 'focus:ring-black/5 dark:focus:ring-accent/50',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored App.tsx successfully.")
