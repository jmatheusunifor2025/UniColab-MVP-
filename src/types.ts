export interface QuestionComment {
  id: string;
  userName: string;
  role: 'student' | 'teacher' | 'ai';
  text: string;
  timestamp: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'geral' | 'especifico';
  area: string;
  year: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  alternatives: string[];
  alternativeIds?: number[];
  correctAlternative: number; // index (0..4), -1 quando o gabarito ainda não foi liberado
  justifications?: string[];
  hasJustification?: boolean;
  commentary: string; // detailed expert explanation
  references: string; // bibliographic reference
  comments: QuestionComment[];
  authorId?: number | null;
}

export interface SimulationHistoryItem {
  id: string;
  title?: string;
  date: string;
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  areasStats: { [area: string]: { total: number; correct: number } };
}

export interface UserStats {
  points: number;
  completedQuestionsCount: number;
  correctCount: number;
  history: SimulationHistoryItem[];
  badges: Badge[];
  areas: { name: string; score: number }[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  unlockedAt?: string;
}

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  role: 'student' | 'teacher';
  course: string;
}
