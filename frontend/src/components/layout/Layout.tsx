import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { StudyTimerModal } from '../common/StudyTimerModal';
import { X } from 'lucide-react';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar onOpenTimer={() => setTimerModalOpen(true)} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-slate-900 z-10 shadow-2xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              onOpenTimer={() => {
                setMobileMenuOpen(false);
                setTimerModalOpen(true);
              }}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenTimer={() => setTimerModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Study Session Timer Modal */}
      <StudyTimerModal
        isOpen={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
      />
    </div>
  );
};

