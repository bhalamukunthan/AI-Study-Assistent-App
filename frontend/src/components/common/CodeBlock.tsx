import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 text-slate-100 text-sm shadow-xl font-mono">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50 text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-indigo-400">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <pre className="m-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

