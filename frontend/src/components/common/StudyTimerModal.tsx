import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { logStudySession } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionLogged?: () => void;
}

const SUBJECT_OPTIONS = [
  'Python & Algorithms',
  'Java & OOP',
  'Data Structures (DSA)',
  'Database Management (DBMS)',
  'Operating Systems',
  'Computer Networks',
  'Web Development',
  'Mathematics',
  'Science',
  'General Study',
];

export const StudyTimerModal: React.FC<StudyTimerModalProps> = ({
  isOpen,
  onClose,
  onSessionLogged,
}) => {
  const { showToast } = useToast();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(0);
  };

  const handleFinish = async () => {
    // If timer was running for less than a minute, minimum 1 minute logged
    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    const targetSubject = subject === 'Other' && customSubject.trim() ? customSubject.trim() : subject;

    try {
      setIsSubmitting(true);
      await logStudySession({
        subject: targetSubject,
        duration_minutes: durationMinutes,
        notes: notes.trim() || undefined,
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast(`Great job! Logged ${durationMinutes} minutes of study for ${targetSubject}.`, 'success');
      handleReset();
      onSessionLogged?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save study session', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                Study Session Timer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track and log your active study time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stopwatch Display */}
        <div className="my-6 text-center">
          <div className="inline-block px-8 py-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/50 dark:border-indigo-800/50">
            <span className="font-mono text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {formatTime(seconds)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 ${
                isActive
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 fill-white" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> {seconds === 0 ? 'Start Study' : 'Resume'}
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={seconds === 0}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Subject Focus
            </label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
            </div>
            {subject === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom subject..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full mt-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Session Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Read chapters 4 & 5, solved 3 graph problems..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            disabled={seconds === 0 || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Logging...' : 'Finish & Save Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

