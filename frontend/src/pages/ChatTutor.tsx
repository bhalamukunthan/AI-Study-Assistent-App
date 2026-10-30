import React, { useEffect, useState, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  BotMessageSquare,
  Sparkles,
  BookOpen,
  User,
  RotateCcw,
  Code2,
  Terminal,
  MessageSquare,
} from 'lucide-react';
import {
  getConversations,
  getConversation,
  sendChatMessage,
  clearConversation,
  deleteConversation,
} from '../services/api';
import { Conversation, ConversationSummary, Message } from '../types';
import { CodeBlock } from '../components/common/CodeBlock';
import { useToast } from '../context/ToastContext';

const SUBJECT_OPTIONS = [
  'General',
  'Python',
  'Java',
  'C / C++',
  'Data Structures & Algorithms',
  'Database Management (DBMS)',
  'Operating Systems',
  'Computer Networks',
  'Mathematics',
  'Science',
];

const PROMPT_SUGGESTIONS = [
  'Explain QuickSort algorithm with an example and time complexity.',
  'What is the difference between TCP and UDP?',
  'Explain ACID properties in DBMS with real-world banking example.',
  'How do Pointers work in C++? Explain with memory diagrams.',
  'What is Deadlock in Operating Systems and how to prevent it?',
];

export const ChatTutor: React.FC = () => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('General');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, loading]);

  const loadConversations = async () => {
    try {
      setInitialLoading(true);
      const list = await getConversations();
      setConversations(list);
      if (list.length > 0) {
        const full = await getConversation(list[0].id);
        setActiveConv(full);
        setSelectedSubject(full.subject || 'General');
      } else {
        setActiveConv(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load conversations', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSelectConversation = async (id: number) => {
    try {
      const full = await getConversation(id);
      setActiveConv(full);
      setSelectedSubject(full.subject || 'General');
    } catch (err: any) {
      showToast(err.message || 'Failed to switch conversation', 'error');
    }
  };

  const handleNewConversation = () => {
    setActiveConv(null);
    setInputMessage('');
  };

  const handleClearCurrent = async () => {
    if (!activeConv) return;
    try {
      await clearConversation(activeConv.id);
      const updated = await getConversation(activeConv.id);
      setActiveConv(updated);
      showToast('Conversation cleared', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear conversation', 'error');
    }
  };

  const handleDeleteCurrent = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      showToast('Conversation deleted', 'info');
      loadConversations();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete conversation', 'error');
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    setInputMessage('');
    setLoading(true);

    // Optimistically show user message
    const tempId = Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeConv?.id || 0,
      sender: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    if (activeConv) {
      setActiveConv({
        ...activeConv,
        messages: [...activeConv.messages, optimisticMsg],
      });
    }

    try {
      const updatedConv = await sendChatMessage(
        textToSend,
        activeConv?.id,
        selectedSubject
      );
      setActiveConv(updatedConv);

      // Refresh list to show latest title / timestamp
      const list = await getConversations();
      setConversations(list);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate response', 'error');
      // If error, refresh conversation state
      if (activeConv) {
        const full = await getConversation(activeConv.id);
        setActiveConv(full);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to render message with formatted code blocks
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineBreak = part.indexOf('\n');
        const lang = part.slice(3, firstLineBreak).trim() || 'code';
        const code = part.slice(firstLineBreak + 1, -3);
        return <CodeBlock key={index} language={lang} code={code} />;
      }

      // Render standard markdown-ish text lines
      return (
        <div key={index} className="space-y-2 whitespace-pre-wrap leading-relaxed text-sm">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
      {/* Conversations Left Drawer */}
      <div className="w-72 border-r border-slate-200/80 dark:border-slate-800 flex flex-col bg-slate-50/60 dark:bg-slate-900/60">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations yet. Start asking!
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectConversation(c.id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs font-medium transition-all group ${
                  activeConv?.id === c.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteCurrent(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {activeConv?.title || 'New Study Session'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ask about concepts, code explanations, or test prep
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {activeConv && (
              <button
                onClick={handleClearCurrent}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear current conversation messages"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-10 text-center space-y-6">
              <div className="inline-flex p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-inner">
                <Sparkles className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  StudyMate AI Personal Tutor
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  I can explain programming algorithms, break down difficult academic concepts, debug your code, and guide your exam revision.
                </p>
              </div>

              {/* Suggestions */}
              <div className="pt-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 text-center">
                  Try asking one of these:
                </p>
                <div className="flex flex-col gap-2">
                  {PROMPT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug)}
                      className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-between group"
                    >
                      <span>{sug}</span>
                      <Send className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 max-w-3xl ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-700'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <BotMessageSquare className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {renderMessageContent(msg.content)}
                  <span
                    className={`block text-[10px] mt-2 opacity-60 text-right ${
                      msg.sender === 'user' ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                <BotMessageSquare className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>StudyMate AI is thinking and formulating the explanation...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <textarea
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (e.g. explain Dijkstra's algorithm, explain pointers, solve math problem)..."
              className="flex-1 bg-transparent border-0 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-32"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-all flex-shrink-0 shadow-sm"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Shift + Enter</kbd> for new line.
          </p>
        </div>
      </div>
    </div>
  );
};

