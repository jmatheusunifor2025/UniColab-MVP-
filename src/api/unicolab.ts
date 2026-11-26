import { Question } from '../types';

export interface AreaOption {
  id: number;
  nome: string;
  componente: string;
}

export interface GradeResult {
  key: Record<string, number>;
  notes: Record<string, string>;
}

export interface RemoteExam {
  id: string;
  title: string;
  minutes: number;
  questionCount: number;
  questionIds: string[];
  personal?: boolean;
}

export interface StartedExam {
  attemptId: number;
  simuladoId: number;
  title: string;
  startedAt: string;
  deadline: string;
  questions: Question[];
  resumed: boolean;
}

export {
  accountHasPassword,
  activateAccount,
  addComment,
  closeExam,
  createExam,
  createPersonalExam,
  createQuestion,
  currentUser,
  deleteQuestion,
  gradePractice,
  listExams,
  listPublicCourses,
  listedPeople,
  loadAreas,
  loadQuestions,
  loadStudentStats,
  loadCoordinatorReport,
  markReplyHelpful,
  signIn,
  signOut,
  startExam,
  submitExam,
  suggestTrailText,
} from '../demo/store';
