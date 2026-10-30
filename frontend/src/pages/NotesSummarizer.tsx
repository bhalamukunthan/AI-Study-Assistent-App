import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Layers,
  HelpCircle,
  ListOrdered,
  FileCheck,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import {
  summarizeNotesText,
  summarizeNotesFile,
  getNotes,
  getNote,
  deleteNote,
} from '../services/api';
import { Flashcard, Note, PracticeQuestion } from '../types';
import { useToast } from '../context/ToastContext';

type SummaryType = 'short' | 'detailed' | 'key_points' | 'flashcards' | 'questions';

const SUMMARY_OPTIONS: { id: SummaryType; label: string; desc: string; icon: any }[] = [
  { id: 'short', label: 'Quick Summary', desc: 'Concise executive summary of core points', icon: FileText },
  { id: 'detailed', label: 'Detailed Guide', desc: 'In-depth breakdown with sections & formulas', icon: BookOpen },
  { id: 'key_points', label: 'Key Takeaways', desc: 'Bullet points of vital facts & concepts', icon: ListOrdered },
  { id: 'flashcards', label: 'Flashcards', desc: 'Interactive front/back study cards', icon: Layers },
  { id: 'questions', label: 'Practice Q&A', desc: 'Exam questions with model answers', icon: HelpCircle },
];

export const NotesSummarizer: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [summaryType, setSummaryType] = useState<SummaryType>('short');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [generating, setGenerating] = useState(false);
  const [notesHistory, setNotesHistory] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Flashcard Viewer State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const list = await getNotes();
      setNotesHistory(list);
      if (list.length > 0) {
        const full = await getNote(list[0].id);
        setActiveNote(full);
      } else {
        setActiveNote(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load notes', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = ['.txt', '.pdf', '.docx'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!validExtensions.includes(fileExt)) {
        showToast('Only .txt, .pdf, and .docx documents are supported', 'warning');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast('File size must be under 15MB', 'warning');
        return;
      }

      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      let note: Note;

      if (activeTab === 'text') {
        if (!textContent.trim() || textContent.length < 15) {
          showToast('Please provide at least 15 characters of study notes to summarize', 'warning');
          return;
        }
        note = await summarizeNotesText(
          title.trim() || 'Study Notes Summary',
          textContent.trim(),
          summaryType
        );
      } else {
        if (!selectedFile) {
          showToast('Please select a document file (.txt, .pdf, .docx)', 'warning');
          return;
        }
        note = await summarizeNotesFile(selectedFile, summaryType, title.trim() || undefined);
      }

      showToast(`Notes summarized into ${summaryType}!`, 'success');
      setActiveNote(note);
      setCardIndex(0);
      setIsFlipped(false);
      loadHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to summarize notes', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note summary?')) return;
    try {
      await deleteNote(id);
      showToast('Note deleted', 'info');
      loadHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete note', 'error');
    }
  };

  const handleCopyText = async () => {
    if (!activeNote) return;
    try {
      await navigator.clipboard.writeText(activeNote.summary_result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const flashcards: Flashcard[] =
    activeNote?.summary_type === 'flashcards' && Array.isArray(activeNote.structured_data)
      ? activeNote.structured_data
      : [];

  const practiceQuestions: PracticeQuestion[] =
    activeNote?.summary_type === 'questions' && Array.isArray(activeNote.structured_data)
      ? activeNote.structured_data
      : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Smart Notes Summarizer & Flashcards
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload TXT, PDF, DOCX or paste notes to generate key takeaways, flashcards, or practice questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
          {/* Tabs: Paste Text vs Upload File */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Upload Document
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Note Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4: Database Transactions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Input by Tab */}
            {activeTab === 'text' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Paste Notes Content
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste textbook excerpts, lecture transcripts, or personal study notes here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Upload Document (PDF, DOCX, TXT)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UploadCloud className="w-8 h-8 text-indigo-500" />
                    {selectedFile ? (
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Click or drag file to upload
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Supports .PDF, .DOCX, .TXT up to 15MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Output Format Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Output Format
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SUMMARY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = summaryType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSummaryType(opt.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing document & generating summary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process Notes</span>
                </>
              )}
            </button>
          </form>

          {/* Past Notes List */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Saved Notes ({notesHistory.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {notesHistory.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setActiveNote(n);
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors group ${
                    activeNote?.id === n.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="truncate pr-2">{n.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {n.summary_type}
                    </span>
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
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

        {/* Output Column (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col">
          {activeNote ? (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    {activeNote.summary_type.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {activeNote.title}
                  </h3>
                  {activeNote.original_filename && (
                    <p className="text-[11px] text-slate-400">
                      Source File: {activeNote.original_filename}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Result</span>
                    </>
                  )}
                </button>
              </div>

              {/* DYNAMIC OUTPUT: FLASHCARDS INTERACTIVE VIEWER */}
              {activeNote.summary_type === 'flashcards' && flashcards.length > 0 ? (
                <div className="space-y-6 my-auto">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>
                      Card {cardIndex + 1} of {flashcards.length}
                    </span>
                    <span>Click card or button to flip</span>
                  </div>

                  {/* 3D Flip Card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full h-72 cursor-pointer perspective-1000 group"
                  >
                    <div
                      className={`w-full h-full p-8 rounded-3xl border text-center flex flex-col items-center justify-center transition-all duration-500 shadow-xl select-none ${
                        isFlipped
                          ? 'bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border-indigo-800 text-white'
                          : 'bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 dark:from-slate-850 dark:to-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3">
                        {isFlipped ? 'Answer / Concept (Back)' : 'Question / Term (Front)'}
                      </span>
                      <p className="text-base sm:text-lg font-bold leading-relaxed max-w-lg">
                        {isFlipped ? flashcards[cardIndex]?.back : flashcards[cardIndex]?.front}
                      </p>
                      <span className="text-[11px] opacity-60 mt-4 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Click to flip
                      </span>
                    </div>
                  </div>

                  {/* Flashcard Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      disabled={cardIndex === 0}
                      onClick={() => {
                        setCardIndex((i) => i - 1);
                        setIsFlipped(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-all"
                    >
                      Flip Card
                    </button>

                    <button
                      disabled={cardIndex === flashcards.length - 1}
                      onClick={() => {
                        setCardIndex((i) => i + 1);
                        setIsFlipped(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30 transition-all"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : activeNote.summary_type === 'questions' && practiceQuestions.length > 0 ? (
                /* PRACTICE QUESTIONS EXPANDABLE LIST */
                <div className="space-y-4 overflow-y-auto max-h-[500px]">
                  {practiceQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        Q{idx + 1}: {q.question}
                      </h4>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                          Model Answer:
                        </span>
                        {q.answer}
                      </div>
                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 italic">
                          Key takeaway: {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* STANDARD TEXT / MARKDOWN SUMMARY */
                <div className="flex-1 overflow-y-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[520px]">
                  {activeNote.summary_result}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <FileText className="w-10 h-10 text-indigo-500 opacity-60" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200">No Summary Displayed</h3>
              <p className="text-xs max-w-sm">
                Paste notes or upload a document on the left, choose your summary format, and click "Process Notes".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

