import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Sparkles,
  Timer,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onOpenTimer: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your learning progress and daily tasks' },
  '/chat': { title: 'AI Chat Tutor', subtitle: 'Ask conceptual questions and code walkthroughs in beginner-friendly language' },
  '/quiz': { title: 'Smart Quiz Generator', subtitle: 'Test your knowledge with AI-crafted practice exams and instant feedback' },
  '/planner': { title: 'AI Study Planner', subtitle: 'Personalized day-by-day learning schedules and milestones' },
  '/notes': { title: 'Notes Summarizer', subtitle: 'Extract key takeaways, detailed guides, and flashcards from documents' },
  '/doubt': { title: 'AI Doubt Solver', subtitle: 'Step-by-step resolution for tricky math, coding, and theory doubts' },
  '/analytics': { title: 'Progress Tracker', subtitle: 'Comprehensive statistics and subject mastery analytics' },
  '/settings': { title: 'Settings', subtitle: 'Manage your profile and Gemini AI configurations' },
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, onOpenTimer }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, health } = useUser();

  const currentInfo = PAGE_TITLES[location.pathname] || {
    title: 'StudyMate AI',
    subtitle: 'Your Personal AI Study Assistant',
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {currentInfo.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Key Status Badge */}
        {health && (
          <div
            onClick={() => !health.ai_configured && navigate('/settings')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              health.ai_configured
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            {health.ai_configured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Gemini API Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Configure Gemini Key</span>
              </>
            )}
          </div>
        )}

        {/* Study Timer Button */}
        <button
          onClick={onOpenTimer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 transition-all"
        >
          <Timer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Timer</span>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* User Avatar */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 hover:ring-indigo-500 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

