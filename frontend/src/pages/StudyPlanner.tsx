import React, { useState, useEffect } from 'react';
import {
  CalendarRange,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Coffee,
  RotateCcw,
  Target,
  Trash2,
  ChevronRight,
  Plus,
} from 'lucide-react';
import {
  generateStudyPlan,
  getStudyPlans,
  getStudyPlan,
  toggleStudyTask,
  deleteStudyPlan,
} from '../services/api';
import { StudyPlan, StudyTask } from '../types';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import confetti from 'canvas-confetti';

const TASK_TYPE_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  study: { icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60', label: 'Study' },
  practice: { icon: Target, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60', label: 'Practice' },
  revision: { icon: RotateCcw, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60', label: 'Revision' },
  break: { icon: Coffee, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60', label: 'Break' },
};

export const StudyPlanner: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useUser();

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [topics, setTopics] = useState('Arrays, Linked Lists, Trees, Graphs, Dynamic Programming');
  const [hoursPerDay, setHoursPerDay] = useState(2.5);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks from now
    return d.toISOString().split('T')[0];
  });
  const [knowledgeLevel, setKnowledgeLevel] = useState('Intermediate');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const list = await getStudyPlans();
      setPlans(list);
      if (list.length > 0) {
        const full = await getStudyPlan(list[0].id);
        setActivePlan(full);
      } else {
        setActivePlan(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load study plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (id: number) => {
    try {
      const full = await getStudyPlan(id);
      setActivePlan(full);
    } catch (err: any) {
      showToast(err.message || 'Failed to select plan', 'error');
    }
  };

  const handleToggleTask = async (task: StudyTask) => {
    try {
      const updated = await toggleStudyTask(task.id);
      if (activePlan) {
        const updatedTasks = activePlan.tasks.map((t) => (t.id === task.id ? updated : t));
        const total = updatedTasks.length;
        const completed = updatedTasks.filter((t) => t.is_completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        setActivePlan({
          ...activePlan,
          tasks: updatedTasks,
          completed_tasks: completed,
          progress_percentage: progress,
        });

        if (!task.is_completed) {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.7 },
          });
          showToast(`Task completed! Progress: ${progress}%`, 'success');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleDeletePlan = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this study plan?')) return;
    try {
      await deleteStudyPlan(id);
      showToast('Study plan deleted', 'info');
      loadPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete plan', 'error');
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const newPlan = await generateStudyPlan({
        student_name: user?.name || 'Alex',
        subject: subject.trim(),
        topics: topics.trim(),
        hours_per_day: hoursPerDay,
        target_date: targetDate,
        knowledge_level: knowledgeLevel,
      });

      setShowCreateModal(false);
      showToast(`Generated personalized study plan with ${newPlan.tasks.length} tasks!`, 'success');
      loadPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate study plan', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Group active plan tasks by day_number
  const groupedTasks: Record<number, StudyTask[]> = {};
  if (activePlan?.tasks) {
    activePlan.tasks.forEach((t) => {
      if (!groupedTasks[t.day_number]) {
        groupedTasks[t.day_number] = [];
      }
      groupedTasks[t.day_number].push(t);
    });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-indigo-600" />
            AI Study Planner & Roadmap
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intelligent timeline schedules tailored to your target completion date
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Study Plan</span>
        </button>
      </div>

      {/* Main Grid: Plan Selector / Sidebar + Detailed Plan View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Plans List Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Your Study Plans ({plans.length})
          </h3>
          <div className="space-y-2">
            {plans.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectPlan(p.id)}
                className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-xs font-medium group ${
                  activePlan?.id === p.id
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-md text-indigo-900 dark:text-indigo-200'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                    {p.title}
                  </h4>
                  <button
                    onClick={(e) => handleDeletePlan(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                    title="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Target: {p.target_date} • {p.hours_per_day}h/day
                </p>

                {/* Mini progress bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${p.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {p.progress_percentage}%
                  </span>
                </div>
              </div>
            ))}

            {plans.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                No study plans generated yet. Click "Generate New Study Plan" to get started!
              </div>
            )}
          </div>
        </div>

        {/* Plan Timeline View */}
        <div className="lg:col-span-3 space-y-6">
          {activePlan ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
              {/* Plan Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      {activePlan.subject}
                    </span>
                    <span className="text-xs text-slate-400">• Level: {activePlan.knowledge_level}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {activePlan.title}
                  </h2>
                  {activePlan.overview && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {activePlan.overview}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-center min-w-36 flex-shrink-0">
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {activePlan.completed_tasks} / {activePlan.total_tasks}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Tasks Finished ({activePlan.progress_percentage}%)
                  </div>
                </div>
              </div>

              {/* Day-by-Day Timeline */}
              <div className="space-y-6">
                {Object.keys(groupedTasks).map((dayStr) => {
                  const dayNum = Number(dayStr);
                  const dayTasks = groupedTasks[dayNum];

                  return (
                    <div key={dayNum} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xs">
                          Day {dayNum}
                        </span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 pl-2 sm:pl-4">
                        {dayTasks.map((t) => {
                          const typeConfig = TASK_TYPE_ICONS[t.task_type] || TASK_TYPE_ICONS.study;
                          const TypeIcon = typeConfig.icon;

                          return (
                            <div
                              key={t.id}
                              onClick={() => handleToggleTask(t)}
                              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer group ${
                                t.is_completed
                                  ? 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                                  : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 shadow-xs hover:shadow-md'
                              }`}
                            >
                              <button className="mt-0.5 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                {t.is_completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${typeConfig.color}`}
                                  >
                                    <TypeIcon className="w-3 h-3" />
                                    {typeConfig.label}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500">
                                    • {t.duration_minutes} mins
                                  </span>
                                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                                    • {t.topic}
                                  </span>
                                </div>

                                <h4
                                  className={`text-sm font-bold text-slate-900 dark:text-slate-100 ${
                                    t.is_completed ? 'line-through text-slate-400' : ''
                                  }`}
                                >
                                  {t.task_title}
                                </h4>

                                {t.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto w-fit">
                <CalendarRange className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Study Plan Selected
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a customized learning timeline with daily durations, revision, and milestone tasks.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
              >
                Create Study Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE STUDY PLAN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create AI Study Plan
                </h3>
                <p className="text-xs text-slate-500">
                  Custom schedule tailored to your daily availability and goals
                </p>
              </div>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems, Calculus, System Design..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Topics to Cover
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Processes, Threads, CPU Scheduling, Deadlocks, Virtual Memory..."
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Available Hours / Day
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Current Knowledge Level
                </label>
                <select
                  value={knowledgeLevel}
                  onChange={(e) => setKnowledgeLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Beginner">Beginner (Start from absolute fundamentals)</option>
                  <option value="Intermediate">Intermediate (Have basics down, focus on depth & practice)</option>
                  <option value="Advanced">Advanced (Fast-paced review and challenging problems)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Generating Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Plan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

