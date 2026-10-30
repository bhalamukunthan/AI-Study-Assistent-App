import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Moon,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const { user, health, updateUser, refreshHealth } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateUser({
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim() || undefined,
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshAI = async () => {
    await refreshHealth();
    showToast('AI Status refreshed', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600" />
          Application Settings & AI Configuration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your personal study profile, appearance, and Gemini AI provider settings
        </p>
      </div>

      {/* AI Key & Provider Configuration Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Google Gemini AI Integration
              </h3>
              <p className="text-xs text-slate-500">
                Official Google Gen AI SDK integration for tutoring, quizzes, & study plans
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshAI}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-colors"
          >
            Check Status
          </button>
        </div>

        {/* Status Indicator Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            health?.ai_configured
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-100'
          }`}
        >
          {health?.ai_configured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          )}

          <div className="text-xs space-y-1">
            <p className="font-bold">
              {health?.ai_configured
                ? `Gemini AI Connected (Model: ${health.model})`
                : 'Gemini API Key is not configured yet'}
            </p>
            <p className="leading-relaxed opacity-90">
              {health?.ai_configured
                ? 'Your backend has a valid Gemini API configuration. All AI features (Chat Tutor, Smart Quiz Generator, Study Planner, Notes Summarizer, Doubt Solver) are fully active.'
                : 'To activate live AI generation, open backend/.env and paste your GEMINI_API_KEY. Never expose API keys in frontend code.'}
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            How to configure your free Gemini API key:
          </h4>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li>
              Visit{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-1"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and create a free API Key.
            </li>
            <li>
              Open the file{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">
                backend/.env
              </code>{' '}
              in your editor.
            </li>
            <li>
              Set <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">GEMINI_API_KEY=your_actual_key_here</code>.
            </li>
            <li>Restart or refresh the application. The system will automatically pick up the new key!</li>
          </ol>
        </div>
      </div>

      {/* Student Profile Settings Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Profile</h3>
            <p className="text-xs text-slate-500">
              Personalize your name and avatar displayed on your dashboard and study plans
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Avatar Image URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Appearance Theme Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Interface Theme</h3>
          <p className="text-xs text-slate-500">Toggle between Light mode and Dark mode</p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

