export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  created_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ConversationSummary {
  id: number;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  id: number;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
  questions: QuizQuestion[];
}

export interface QuizAnswerDetail {
  question_id: number;
  question: string;
  options: string[];
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

export interface QuizResult {
  id: number;
  quiz_id: number;
  quiz_title: string;
  subject: string;
  difficulty: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers_detail: QuizAnswerDetail[];
  completed_at: string;
}

export interface StudyTask {
  id: number;
  plan_id: number;
  day_number: number;
  date_str?: string;
  topic: string;
  task_title: string;
  description?: string;
  duration_minutes: number;
  task_type: 'study' | 'practice' | 'revision' | 'break';
  is_completed: boolean;
  completed_at?: string;
}

export interface StudyPlan {
  id: number;
  title: string;
  student_name: string;
  subject: string;
  topics: string;
  hours_per_day: number;
  target_date: string;
  knowledge_level: string;
  overview?: string;
  created_at: string;
  tasks: StudyTask[];
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface PracticeQuestion {
  question: string;
  answer: string;
  explanation: string;
}

export interface Note {
  id: number;
  title: string;
  original_filename?: string;
  file_type: string;
  summary_type: 'short' | 'detailed' | 'key_points' | 'flashcards' | 'questions';
  content: string;
  summary_result: string;
  structured_data?: Flashcard[] | PracticeQuestion[] | any;
  created_at: string;
}

export interface Doubt {
  id: number;
  title: string;
  subject: string;
  category: 'programming' | 'mathematics' | 'theory' | 'academic';
  question_text: string;
  code_snippet?: string;
  step_by_step_solution: string;
  core_concepts?: string;
  related_topics?: string;
  created_at: string;
}

export interface StudySession {
  id: number;
  user_id: number;
  subject: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

export interface WeeklyActivityPoint {
  day: string;
  date: string;
  hours: number;
  sessions: number;
  quizzes: number;
}

export interface SubjectBreakdown {
  subject: string;
  hours: number;
  percentage: number;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: 'chat' | 'quiz' | 'plan' | 'note' | 'doubt' | 'session';
  title: string;
  description: string;
  timestamp: string;
}

export interface UpcomingTask {
  id: number;
  plan_id: number;
  plan_title: string;
  task_title: string;
  topic: string;
  duration_minutes: number;
  task_type: string;
  date_str?: string;
  is_completed: boolean;
}

export interface DashboardAnalytics {
  student_name: string;
  today_study_hours: number;
  total_study_hours: number;
  total_questions_asked: number;
  quizzes_completed: number;
  current_streak_days: number;
  average_quiz_score: number;
  completed_tasks_count: number;
  total_tasks_count: number;
  weekly_activity: WeeklyActivityPoint[];
  subject_distribution: SubjectBreakdown[];
  recent_activities: RecentActivity[];
  upcoming_tasks: UpcomingTask[];
}

export interface HealthStatus {
  status: string;
  app: string;
  ai_configured: boolean;
  model: string;
  api_version: string;
}
