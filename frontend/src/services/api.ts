import axios from 'axios';
import {
  Conversation,
  ConversationSummary,
  DashboardAnalytics,
  Doubt,
  HealthStatus,
  Note,
  Quiz,
  QuizResult,
  StudyPlan,
  StudySession,
  StudyTask,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds for AI generation tasks
});

// Response error handler to extract readable error message
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.message) {
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out while waiting for AI generation. Please retry.';
      } else if (error.message.includes('Network Error')) {
        message = 'Cannot connect to backend server. Please verify FastAPI is running on http://localhost:8000.';
      } else {
        message = error.message;
      }
    }
    return Promise.reject(new Error(message));
  }
);

// Health
export const getHealthStatus = async (): Promise<HealthStatus> => {
  const res = await apiClient.get<HealthStatus>('/health');
  return res.data;
};

// User
export const getUserProfile = async (): Promise<User> => {
  const res = await apiClient.get<User>('/user/profile');
  return res.data;
};

export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  const res = await apiClient.put<User>('/user/profile', data);
  return res.data;
};

// Analytics
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const res = await apiClient.get<DashboardAnalytics>('/analytics/dashboard');
  return res.data;
};

// Chat
export const getConversations = async (): Promise<ConversationSummary[]> => {
  const res = await apiClient.get<ConversationSummary[]>('/chat/conversations');
  return res.data;
};

export const getConversation = async (id: number): Promise<Conversation> => {
  const res = await apiClient.get<Conversation>(`/chat/conversations/${id}`);
  return res.data;
};

export const sendChatMessage = async (
  content: string,
  conversationId?: number,
  subject: string = 'General'
): Promise<Conversation> => {
  const res = await apiClient.post<Conversation>('/chat/message', {
    content,
    conversation_id: conversationId,
    subject,
  });
  return res.data;
};

export const deleteConversation = async (id: number): Promise<void> => {
  await apiClient.delete(`/chat/conversations/${id}`);
};

export const clearConversation = async (id: number): Promise<void> => {
  await apiClient.post(`/chat/conversations/${id}/clear`);
};

// Quiz
export const generateQuiz = async (
  subject: string,
  topic: string,
  difficulty: string,
  questionCount: number = 5
): Promise<Quiz> => {
  const res = await apiClient.post<Quiz>('/quiz/generate', {
    subject,
    topic,
    difficulty,
    question_count: questionCount,
    question_type: 'Multiple Choice',
  });
  return res.data;
};

export const getQuiz = async (id: number): Promise<Quiz> => {
  const res = await apiClient.get<Quiz>(`/quiz/${id}`);
  return res.data;
};

export const submitQuiz = async (
  quizId: number,
  answers: Record<number, string>
): Promise<QuizResult> => {
  const res = await apiClient.post<QuizResult>(`/quiz/${quizId}/submit`, {
    answers,
  });
  return res.data;
};

export const getQuizResults = async (): Promise<any[]> => {
  const res = await apiClient.get<any[]>('/quiz/results/all');
  return res.data;
};

export const getQuizResultDetail = async (resultId: number): Promise<QuizResult> => {
  const res = await apiClient.get<QuizResult>(`/quiz/results/${resultId}`);
  return res.data;
};

// Study Plans
export const generateStudyPlan = async (data: {
  student_name: string;
  subject: string;
  topics: string;
  hours_per_day: number;
  target_date: string;
  knowledge_level: string;
}): Promise<StudyPlan> => {
  const res = await apiClient.post<StudyPlan>('/study-plans/generate', data);
  return res.data;
};

export const getStudyPlans = async (): Promise<StudyPlan[]> => {
  const res = await apiClient.get<StudyPlan[]>('/study-plans');
  return res.data;
};

export const getStudyPlan = async (id: number): Promise<StudyPlan> => {
  const res = await apiClient.get<StudyPlan>(`/study-plans/${id}`);
  return res.data;
};

export const deleteStudyPlan = async (id: number): Promise<void> => {
  await apiClient.delete(`/study-plans/${id}`);
};

export const toggleStudyTask = async (taskId: number): Promise<StudyTask> => {
  const res = await apiClient.patch<StudyTask>(`/study-tasks/${taskId}/toggle`);
  return res.data;
};

// Notes
export const summarizeNotesText = async (
  title: string,
  content: string,
  summaryType: string
): Promise<Note> => {
  const res = await apiClient.post<Note>('/notes/summarize', {
    title,
    content,
    summary_type: summaryType,
  });
  return res.data;
};

export const summarizeNotesFile = async (
  file: File,
  summaryType: string,
  title?: string
): Promise<Note> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('summary_type', summaryType);
  if (title) formData.append('title', title);

  const res = await apiClient.post<Note>('/notes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getNotes = async (): Promise<Note[]> => {
  const res = await apiClient.get<Note[]>('/notes');
  return res.data;
};

export const getNote = async (id: number): Promise<Note> => {
  const res = await apiClient.get<Note>(`/notes/${id}`);
  return res.data;
};

export const deleteNote = async (id: number): Promise<void> => {
  await apiClient.delete(`/notes/${id}`);
};

// Doubts
export const solveDoubt = async (data: {
  subject: string;
  category: string;
  question_text: string;
  code_snippet?: string;
}): Promise<Doubt> => {
  const res = await apiClient.post<Doubt>('/doubt/solve', data);
  return res.data;
};

export const getDoubtHistory = async (): Promise<Doubt[]> => {
  const res = await apiClient.get<Doubt[]>('/doubt/history');
  return res.data;
};

export const getDoubtDetail = async (id: number): Promise<Doubt> => {
  const res = await apiClient.get<Doubt>(`/doubt/${id}`);
  return res.data;
};

export const deleteDoubt = async (id: number): Promise<void> => {
  await apiClient.delete(`/doubt/${id}`);
};

// Study Sessions
export const logStudySession = async (data: {
  subject: string;
  duration_minutes: number;
  notes?: string;
}): Promise<StudySession> => {
  const res = await apiClient.post<StudySession>('/sessions', data);
  return res.data;
};

export const getStudySessions = async (): Promise<StudySession[]> => {
  const res = await apiClient.get<StudySession[]>('/sessions');
  return res.data;
};

export const deleteStudySession = async (id: number): Promise<void> => {
  await apiClient.delete(`/sessions/${id}`);
};

