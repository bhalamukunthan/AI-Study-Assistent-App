import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Code2,
  Calculator,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ListChecks,
  Compass,
  Trash2,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { solveDoubt, getDoubtHistory, getDoubtDetail, deleteDoubt } from '../services/api';
import { Doubt } from '../types';
import { CodeBlock } from '../components/common/CodeBlock';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  { id: 'programming', label: 'Programming & Bug Fixing', icon: Code2, placeholder: 'e.g. Why is my binary search returning -1 for existing elements?' },
  { id: 'mathematics', label: 'Mathematics & Formulas', icon: Calculator, placeholder: 'e.g. How to find the eigenvalues of this 2x2 matrix?' },
  { id: 'theory', label: 'Theory & Systems', icon: BookOpen, placeholder: 'e.g. How does cache coherency protocol (MESI) work?' },
  { id: 'academic', label: 'General Academic Doubt', icon: Lightbulb, placeholder: 'e.g. What is the difference between supervised and unsupervised learning?' },
];

export const DoubtSolver: React.FC = () => {
  const { showToast } = useToast();

  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [category, setCategory] = useState<'programming' | 'mathematics' | 'theory' | 'academic'>('programming');
  const [questionText, setQuestionText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [solving, setSolving] = useState(false);

  const [activeDoubt, setActiveDoubt] = useState<Doubt | null>(null);
  const [history, setHistory] = useState<Doubt[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const list = await getDoubtHistory();
      setHistory(list);
      if (list.length > 0) {
        const full = await getDoubtDetail(list[0].id);
        setActiveDoubt(full);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load doubt history', 'error');
    }
  };

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      showToast('Please describe your doubt or problem', 'warning');
      return;
    }

    try {
      setSolving(true);
      const res = await solveDoubt({
        subject: subject.trim(),
        category,
        question_text: questionText.trim(),
        code_snippet: codeSnippet.trim() || undefined,
      });

      setActiveDoubt(res);
      showToast('Doubt resolved with step-by-step breakdown!', 'success');
      loadHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to solve doubt', 'error');
    } finally {
      setSolving(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this solved doubt from history?')) return;
    try {
      await deleteDoubt(id);
      showToast('Deleted doubt', 'info');
      loadHistory();
      if (activeDoubt?.id === id) {
        setActiveDoubt(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete doubt', 'error');
    }
  };

  const renderSolutionContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineBreak = part.indexOf('\n');
        const lang = part.slice(3, firstLineBreak).trim() || 'text';
        const code = part.slice(firstLineBreak + 1, -3);
        return <CodeBlock key={index} language={lang} code={code} />;
      }
      return (
        <div key={index} className="space-y-2 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          AI Doubt Solver & Code Debugger
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Get step-by-step resolutions, underlying concepts, and related practice topics for any tricky problem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
          <form onSubmit={handleSolve} className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Python, Java, Calculus, DBMS..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />
                      <span className="truncate">{cat.label.split('&')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doubt / Question */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Doubt Description / Error
              </label>
              <textarea
                rows={3}
                required
                placeholder={CATEGORIES.find((c) => c.id === category)?.placeholder}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Optional Code Snippet */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Code or Math Snippet (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="Paste buggy code snippet, stack trace, or math expression..."
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={solving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 shadow-md shadow-orange-600/20 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {solving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>AI is solving step-by-step...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve My Doubt</span>
                </>
              )}
            </button>
          </form>

          {/* Past Doubts List */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Recently Solved ({history.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setActiveDoubt(d)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors group ${
                    activeDoubt?.id === d.id
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="truncate pr-2">{d.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{d.subject}</span>
                    <button
                      onClick={(e) => handleDelete(d.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Column (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col">
          {activeDoubt ? (
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[640px] pr-2">
              {/* Doubt Header */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                    {activeDoubt.subject}
                  </span>
                  <span className="text-xs text-slate-400">• {activeDoubt.category}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {activeDoubt.title}
                </h3>
              </div>

              {/* Original Question Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Student's Question:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {activeDoubt.question_text}
                </p>
                {activeDoubt.code_snippet && (
                  <CodeBlock code={activeDoubt.code_snippet} language={activeDoubt.subject.toLowerCase()} />
                )}
              </div>

              {/* Step-by-Step Resolution */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  <ListChecks className="w-4 h-4" />
                  <span>Step-by-Step Explanation & Resolution</span>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                  {renderSolutionContent(activeDoubt.step_by_step_solution)}
                </div>
              </div>

              {/* Core Concepts */}
              {activeDoubt.core_concepts && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Important Concepts & Principles</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {activeDoubt.core_concepts}
                  </div>
                </div>
              )}

              {/* Related Topics / Next Steps */}
              {activeDoubt.related_topics && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400">
                    <Compass className="w-4 h-4" />
                    <span>Recommended Next Topics & Practice</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {activeDoubt.related_topics}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <Lightbulb className="w-10 h-10 text-amber-500 opacity-60" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200">No Doubt Selected</h3>
              <p className="text-xs max-w-sm">
                Enter your question, error message, or buggy code on the left to get an in-depth AI resolution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

