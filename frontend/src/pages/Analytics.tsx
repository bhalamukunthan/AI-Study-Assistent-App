import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  Trophy,
  CheckCircle2,
  Calendar,
  Flame,
  PieChart as PieIcon,
  TrendingUp,
  Award,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { getDashboardAnalytics, getStudySessions, deleteStudySession } from '../services/api';
import { DashboardAnalytics, StudySession } from '../types';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

const PIE_COLORS = ['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const Analytics: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, sessionList] = await Promise.all([
        getDashboardAnalytics(),
        getStudySessions(),
      ]);
      setData(analyticsData);
      setSessions(sessionList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load progress data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!window.confirm('Delete this study session log?')) return;
    try {
      await deleteStudySession(id);
      showToast('Study session deleted', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete session', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Learning Analytics & Progress Tracker
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Real-time statistics computed directly from your study sessions, quizzes, and tasks
        </p>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Study Time
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.total_study_hours ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">hours</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Across {sessions.length} recorded sessions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Quiz Score
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.average_quiz_score ?? 0}%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            From {data?.quizzes_completed ?? 0} completed quizzes
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tasks Completed
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.completed_tasks_count ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {data?.total_tasks_count ?? 0}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data?.total_tasks_count
              ? Math.round(((data.completed_tasks_count || 0) / data.total_tasks_count) * 100)
              : 0}
            % completion rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Streak
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.current_streak_days ?? 1}
            </span>
            <span className="text-xs font-medium text-slate-500">days active</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Keep studying to preserve streak!
          </p>
        </div>
      </div>

      {/* Two Large Recharts Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Learning Trend Area Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                7-Day Study Hours Trend
              </h3>
              <p className="text-xs text-slate-500">Time invested in learning each day</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.weekly_activity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 text-white text-xs space-y-1 shadow-xl">
                          <p className="font-bold text-indigo-400">{item.day} ({item.date})</p>
                          <p>Study Hours: <span className="font-semibold">{item.hours} hrs</span></p>
                          <p>Sessions: <span className="font-semibold">{item.sessions}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown Pie Chart / Bars */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-600" />
                Subject Distribution
              </h3>
              <p className="text-xs text-slate-500">Time allocation across subjects</p>
            </div>
          </div>

          {data?.subject_distribution && data.subject_distribution.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.subject_distribution}
                      dataKey="hours"
                      nameKey="subject"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {data.subject_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl">
                              <p className="font-bold">{item.subject}</p>
                              <p>{item.hours} hours ({item.percentage}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {data.subject_distribution.map((s, idx) => (
                  <div key={s.subject} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {s.subject}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">
                      {s.hours}h ({s.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              No subject data yet. Complete study sessions or quizzes to see your distribution!
            </div>
          )}
        </div>
      </div>

      {/* Logged Study Sessions History Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Recorded Study Sessions History
            </h3>
            <p className="text-xs text-slate-500">Every session logged with the interactive timer</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No study sessions logged yet. Use the timer button in the top bar to track your sessions!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/60 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {sess.subject}
                    </td>
                    <td className="p-3.5 font-semibold text-indigo-600 dark:text-indigo-400">
                      {sess.duration_minutes} minutes
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(sess.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {sess.notes || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

