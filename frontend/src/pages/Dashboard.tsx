import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  HelpCircle,
  Trophy,
  Flame,
  ArrowRight,
  BotMessageSquare,
  CalendarRange,
  FileText,
  Lightbulb,
  CheckCircle2,
  Circle,
  Sparkles,
  BarChart2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getDashboardAnalytics, toggleStudyTask } from '../services/api';
import { DashboardAnalytics, UpcomingTask } from '../types';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { health } = useUser();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDashboardAnalytics();
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (task: UpcomingTask) => {
    try {
      await toggleStudyTask(task.id);
      showToast(
        task.is_completed ? `Marked "${task.task_title}" as pending` : `Completed "${task.task_title}"! 🎉`,
        'success'
      );
      // Refresh dashboard to recalculate tasks and stats
      fetchDashboard();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* AI Key Notice Banner if not configured */}
      {health && !health.ai_configured && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Gemini API Key Required for Live AI Features
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Add your free Gemini API key to <code className="px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50 font-mono">backend/.env</code> to activate the AI Tutor, Quiz Generator, and Study Planner.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 transition-colors"
          >
            Configure Key
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Learning Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {data?.student_name || 'Alex'}! 👋
          </h2>
          <p className="mt-2 text-sm sm:text-base text-indigo-100 leading-relaxed">
            Ready to master new concepts today? Ask your AI Tutor, take a practice quiz, or continue your personalized study schedule.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <BotMessageSquare className="w-4 h-4" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-700/60 hover:bg-indigo-700 text-white border border-white/20 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Practice Quiz</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Today's Study Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Study
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.today_study_hours ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">hours</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Total logged: <span className="font-semibold text-slate-700 dark:text-slate-300">{data?.total_study_hours ?? 0} hrs</span>
          </p>
        </div>

        {/* Total Questions Asked */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Questions Asked
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <BotMessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.total_questions_asked ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">queries</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Across all tutoring sessions
          </p>
        </div>

        {/* Quizzes Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quizzes Completed
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.quizzes_completed ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">exams</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Average score: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{data?.average_quiz_score ?? 0}%</span>
          </p>
        </div>

        {/* Current Learning Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Streak
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.current_streak_days ?? 1}
            </span>
            <span className="text-xs font-medium text-slate-500">days</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Keep studying daily to maintain momentum!
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { title: 'AI Chat Tutor', desc: 'Ask doubts & code', icon: BotMessageSquare, path: '/chat', color: 'from-blue-500 to-indigo-600' },
            { title: 'Smart Quiz', desc: 'Test your topics', icon: HelpCircle, path: '/quiz', color: 'from-purple-500 to-pink-600' },
            { title: 'Study Planner', desc: 'Milestone roadmap', icon: CalendarRange, path: '/planner', color: 'from-indigo-500 to-purple-600' },
            { title: 'Summarize Notes', desc: 'Doc & PDF extract', icon: FileText, path: '/notes', color: 'from-emerald-500 to-teal-600' },
            { title: 'Doubt Solver', desc: 'Code & math issues', icon: Lightbulb, path: '/doubt', color: 'from-amber-500 to-orange-600' },
          ].map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(act.path)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-indigo-500/50 hover:shadow-md transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {act.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {act.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Weekly Chart & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Learning Activity Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Weekly Learning Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily study hours logged over the last 7 days
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
              <span>Study Hours</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekly_activity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs space-y-1 border border-slate-800">
                          <p className="font-bold text-indigo-300">{item.day} ({item.date})</p>
                          <p>Hours Studied: <span className="font-semibold">{item.hours} hrs</span></p>
                          <p>Sessions Logged: <span className="font-semibold">{item.sessions}</span></p>
                          <p>Quizzes Taken: <span className="font-semibold">{item.quizzes}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Study Tasks */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-purple-600" />
                Upcoming Tasks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Next items from your study plans
              </p>
            </div>
            <button
              onClick={() => navigate('/planner')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-72">
            {data?.upcoming_tasks && data.upcoming_tasks.length > 0 ? (
              data.upcoming_tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group"
                >
                  <button className="mt-0.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {task.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-slate-900 dark:text-slate-100 truncate ${task.is_completed ? 'line-through opacity-60' : ''}`}>
                      {task.task_title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-medium">
                        {task.topic}
                      </span>
                      <span>{task.duration_minutes}m</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1">Generate a study plan to track new tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Recent Learning Activities
        </h3>

        {data?.recent_activities && data.recent_activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recent_activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px]">
                    {act.type}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {act.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {act.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No recent activities yet. Start studying to build your timeline!
          </p>
        )}
      </div>
    </div>
  );
};

