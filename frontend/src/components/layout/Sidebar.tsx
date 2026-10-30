import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BotMessageSquare,
  HelpCircle,
  CalendarRange,
  FileText,
  Lightbulb,
  BarChart3,
  Settings,
  Sparkles,
  Flame,
  Timer,
  BookOpen,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface SidebarProps {
  onOpenTimer: () => void;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'AI Chat Tutor', path: '/chat', icon: BotMessageSquare, badge: 'Smart' },
  { name: 'Quiz Generator', path: '/quiz', icon: HelpCircle },
  { name: 'Study Planner', path: '/planner', icon: CalendarRange },
  { name: 'Notes Summarizer', path: '/notes', icon: FileText },
  { name: 'AI Doubt Solver', path: '/doubt', icon: Lightbulb },
  { name: 'Progress Tracker', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onOpenTimer, onCloseMobile }) => {
  const { user, health } = useUser();

  return (
    <aside className="w-64 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <BookOpen className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                StudyMate
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Personal Study Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action: Start Session Timer */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onOpenTimer}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Timer className="w-4 h-4" />
          <span>Start Study Session</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* AI Status Pill */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.ai_configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {health?.ai_configured ? 'Gemini AI Active' : 'AI Key Missing'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {health?.model ? 'Flash' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Student Profile Card Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'Student'}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user?.name || 'Alex Rivera'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Computer Science
            </p>
          </div>
          <div
            title="Learning Streak"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-bold"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

