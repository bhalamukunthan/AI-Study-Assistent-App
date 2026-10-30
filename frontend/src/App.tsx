import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ChatTutor } from './pages/ChatTutor';
import { QuizGenerator } from './pages/QuizGenerator';
import { StudyPlanner } from './pages/StudyPlanner';
import { NotesSummarizer } from './pages/NotesSummarizer';
import { DoubtSolver } from './pages/DoubtSolver';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="chat" element={<ChatTutor />} />
                <Route path="quiz" element={<QuizGenerator />} />
                <Route path="planner" element={<StudyPlanner />} />
                <Route path="notes" element={<NotesSummarizer />} />
                <Route path="doubt" element={<DoubtSolver />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
