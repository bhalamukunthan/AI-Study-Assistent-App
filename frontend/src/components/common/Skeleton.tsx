import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
      <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-end justify-between p-4 gap-2">
        {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t-lg"
            style={{ height: `${h}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
};

