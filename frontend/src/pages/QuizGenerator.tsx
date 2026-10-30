import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Clock,
  BookOpen,
  Award,
} from 'lucide-react';
import { generateQuiz, submitQuiz, getQuizResults, getQuizResultDetail } from '../services/api';
import { Quiz, QuizResult } from '../types';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

const POPULAR_SUBJECTS = [
  'Data Structures & Algorithms',
  'Python Programming',
  'Java Core & OOP',
  'Database Management (DBMS)',
  'Operating Systems',
  'Computer Networks',
  'System Design',
  'Mathematics & Calculus',
  'Physics',
];

export const QuizGenerator: React.FC = () => {
  const { showToast } = useToast();

  // Mode: 'generate' | 'taking' | 'result' | 'history'
  const [viewState, setViewState] = useState<'generate' | 'taking' | 'result' | 'history'>('generate');

  // Form State
  const [subject, setSubject] = useState(POPULAR_SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('Binary Search & Sorting');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Result State
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject;
    if (!finalSubject || !topic.trim()) {
      showToast('Please specify subject and topic', 'warning');
      return;
    }

    try {
      setGenerating(true);
      const quiz = await generateQuiz(finalSubject, topic.trim(), difficulty, questionCount);
      setActiveQuiz(quiz);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setViewState('taking');
      showToast(`Generated ${quiz.questions.length} questions on ${topic}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate quiz', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // Check if any question was left unanswered
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < activeQuiz.questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${activeQuiz.questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      const result = await submitQuiz(activeQuiz.id, selectedAnswers);
      setQuizResult(result);
      setViewState('result');

      // Trigger Confetti for passing score (>= 60%)
      if (result.percentage >= 60) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      showToast(`Quiz completed! You scored ${result.score}/${result.total_questions}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit quiz', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadHistory = async () => {
    try {
      const res = await getQuizResults();
      setHistoryList(res);
      setViewState('history');
    } catch (err: any) {
      showToast(err.message || 'Failed to load past quizzes', 'error');
    }
  };

  const handleViewHistoricalResult = async (resultId: number) => {
    try {
      const res = await getQuizResultDetail(resultId);
      setQuizResult(res);
      setViewState('result');
    } catch (err: any) {
      showToast(err.message || 'Failed to load quiz details', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Tab Bar / Header Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewState('generate')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewState === 'generate' || viewState === 'taking'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Create New Quiz
          </button>
          <button
            onClick={handleLoadHistory}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewState === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Quiz History & Scores
          </button>
        </div>
      </div>

      {/* VIEW: GENERATE FORM */}
      {viewState === 'generate' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Generate Smart Practice Quiz
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI will formulate multiple-choice questions with 4 options and detailed explanations.
              </p>
            </div>
          </div>

          <form onSubmit={handleStartGeneration} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {POPULAR_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Other">Custom Subject</option>
                </select>
                {subject === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter subject name..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Topic / Subtopic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Traversals, Pointers, ACID Properties..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        difficulty === diff
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        questionCount === count
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>AI is crafting questions & explanations...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Quiz Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: TAKING QUIZ (Interactive step-by-step player) */}
      {viewState === 'taking' && activeQuiz && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {/* Quiz Header & Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span className="uppercase tracking-wider">
                Question {currentQIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {activeQuiz.difficulty}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Current Question Card */}
          {(() => {
            const currentQ = activeQuiz.questions[currentQIndex];
            const currentSelected = selectedAnswers[currentQ.id];

            return (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 gap-3">
                  {currentQ.options.map((opt, idx) => {
                    const isChosen = currentSelected === opt;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`flex items-center gap-3.5 p-4 rounded-2xl text-left border text-sm font-medium transition-all ${
                          isChosen
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-600'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isChosen
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((i) => i - 1)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {currentQIndex < activeQuiz.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQIndex((i) => i + 1)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitQuiz}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      {submitting ? 'Calculating Score...' : 'Submit Quiz'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW: RESULT & EXPLANATION BREAKDOWN */}
      {viewState === 'result' && quizResult && (
        <div className="space-y-6">
          {/* Result Card Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-800/50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-yellow-300" />
                <span>Quiz Performance Report</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">{quizResult.quiz_title}</h2>
              <p className="text-xs sm:text-sm text-indigo-200">
                Completed on {new Date(quizResult.completed_at).toLocaleString()}
              </p>
            </div>

            <div className="text-center bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 min-w-36">
              <div className="text-4xl font-extrabold text-white">
                {quizResult.score} / {quizResult.total_questions}
              </div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mt-1">
                Score: {quizResult.percentage}%
              </div>
              <div className="mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block bg-white/20">
                {quizResult.percentage >= 80 ? 'Mastery! 🌟' : quizResult.percentage >= 60 ? 'Passed 👍' : 'Keep Practicing 💪'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setViewState('generate')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Create Another Quiz</span>
            </button>
          </div>

          {/* Detailed Question Explanations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Detailed Answers & Explanations ({quizResult.answers_detail.length} questions)
            </h3>

            {quizResult.answers_detail.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  item.is_correct
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {idx + 1}. {item.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Your Answer:
                        </span>
                        <span
                          className={`font-semibold ${
                            item.is_correct ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {item.selected_answer || '(No answer provided)'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Correct Answer:
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.correct_answer}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                        Explanation:
                      </span>
                      {item.explanation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: QUIZ HISTORY */}
      {viewState === 'history' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Past Quiz Results</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review your previous scores and analyze your progress
              </p>
            </div>
          </div>

          {historyList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No completed quizzes found. Generate and complete a quiz to view results here!
            </div>
          ) : (
            <div className="space-y-3">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleViewHistoricalResult(item.id)}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.quiz_title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Completed on {new Date(item.completed_at).toLocaleDateString()} at{' '}
                      {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {item.score}/{item.total_questions}
                      </span>
                      <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.percentage}%
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

