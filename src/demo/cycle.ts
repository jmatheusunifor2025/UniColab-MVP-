import { Question } from '../types';
import { ListedPerson } from './roster';

export const CYCLE_PERIODS = ['2026.1', '2025.2'] as const;

const ADS = 'Análise e Desenvolvimento de Sistemas';
const CC = 'Ciência da Computação';
const EC = 'Engenharia da Computação';

/** Áreas cuja curadoria nominal pertence ao professor. Formação geral fica fora do extrato. */
export const CURATION: Record<string, string[]> = {
  'helena.duarte@edu.unifor.br': [
    'Padrões de Projeto & Engenharia de Software',
    'Engenharia de Software',
    'Engenharia de Bancos de Dados Relacionais',
    'Banco de Dados',
  ],
  'ricardo.nunes@edu.unifor.br': [
    'Inteligência Artificial & Ciência de Dados',
    'Algoritmos & Estruturas de Dados',
    'Algoritmos',
  ],
  'marina.alves@edu.unifor.br': [
    'Arquitetura de Sistemas Distributed',
    'Infraestrutura & Redes de Computadores',
  ],
};

/** Simulados já encerrados do ciclo que não estão mais abertos para a turma. */
const CLOSED_EXAMS = [
  {
    authorEmail: 'helena.duarte@edu.unifor.br',
    course: ADS,
    period: '2025.2',
  },
  {
    authorEmail: 'ricardo.nunes@edu.unifor.br',
    course: CC,
    period: '2026.1',
  },
  {
    authorEmail: 'marina.alves@edu.unifor.br',
    course: EC,
    period: '2026.1',
  },
];

/** Resumo pré-calculado dos simulados encerrados. Não há nome nem nota de estudante. */
const CLOSED_SLICES = [
  { course: ADS, area: 'Padrões de Projeto & Engenharia de Software', period: '2026.1', answered: 42, wrong: 15 },
  { course: ADS, area: 'Engenharia de Software', period: '2026.1', answered: 30, wrong: 9 },
  { course: ADS, area: 'Banco de Dados', period: '2026.1', answered: 24, wrong: 11 },
  { course: ADS, area: 'Engenharia de Bancos de Dados Relacionais', period: '2026.1', answered: 18, wrong: 8 },
  { course: ADS, area: 'Formação Geral', period: '2026.1', answered: 20, wrong: 6 },
  { course: ADS, area: 'Responsabilidade Social & ESG', period: '2026.1', answered: 12, wrong: 4 },
  { course: CC, area: 'Inteligência Artificial & Ciência de Dados', period: '2026.1', answered: 27, wrong: 12 },
  { course: CC, area: 'Algoritmos & Estruturas de Dados', period: '2026.1', answered: 22, wrong: 7 },
  { course: CC, area: 'Algoritmos', period: '2026.1', answered: 33, wrong: 10 },
  { course: CC, area: 'Formação Geral', period: '2026.1', answered: 18, wrong: 7 },
  { course: CC, area: 'Tecnologia & Ética na Sociedade', period: '2026.1', answered: 14, wrong: 5 },
  { course: EC, area: 'Arquitetura de Sistemas Distributed', period: '2026.1', answered: 26, wrong: 11 },
  { course: EC, area: 'Infraestrutura & Redes de Computadores', period: '2026.1', answered: 19, wrong: 6 },
  { course: EC, area: 'Formação Geral', period: '2026.1', answered: 15, wrong: 5 },
  { course: ADS, area: 'Engenharia de Software', period: '2025.2', answered: 16, wrong: 7 },
  { course: CC, area: 'Algoritmos', period: '2025.2', answered: 14, wrong: 4 },
  { course: EC, area: 'Arquitetura de Sistemas Distributed', period: '2025.2', answered: 12, wrong: 5 },
];

const CLOSED_SITTINGS = [
  { course: ADS, period: '2026.1', attempts: 18 },
  { course: CC, period: '2026.1', attempts: 15 },
  { course: EC, period: '2026.1', attempts: 11 },
  { course: ADS, period: '2025.2', attempts: 9 },
  { course: CC, period: '2025.2', attempts: 8 },
  { course: EC, period: '2025.2', attempts: 6 },
];

export interface ReportFilters {
  course: string;
  area: string;
  period: string;
}

export interface CompetencyRow {
  area: string;
  answered: number;
  wrong: number;
  errorPercent: number;
  openDoubts: number;
}

export interface ThemeRow {
  area: string;
  openDoubts: number;
  recurring: boolean;
  sample: string;
}

export interface TeacherRow {
  name: string;
  course: string;
  specialty: string;
  areas: string[];
  questions: number;
  exams: number;
  forumReplies: number;
  helpful: number;
}

export interface CoordinatorReport {
  studentsOnList: number;
  finishedAttempts: number;
  answered: number;
  errorPercent: number | null;
  openDoubts: number;
  teacherReplies: number;
  recurringThemes: number;
  emptySimulados: boolean;
  competencies: CompetencyRow[];
  themes: ThemeRow[];
  teachers: TeacherRow[];
  courseOptions: string[];
  areaOptions: string[];
}

interface ExamRecord {
  id?: string;
  personal?: boolean;
  authorEmail?: string;
  course?: string;
  period?: string;
}

interface ProgressRecord {
  history: unknown[];
  byArea: Record<string, { total: number; correct: number }>;
}

const CURATED_AREAS = new Set(Object.values(CURATION).flat());

function courseMatch(course: string, filter: string) {
  return !filter || course === filter;
}

function areaMatch(area: string, filter: string) {
  return !filter || area === filter;
}

function teacherForArea(email: string, area: string) {
  return (CURATION[email] || []).includes(area);
}

function questionCurator(question: Question, teachers: ListedPerson[]) {
  if (question.authorId) {
    return teachers.find((teacher) => teacher.id === question.authorId);
  }
  return teachers.find((teacher) => teacherForArea(teacher.email, question.area));
}

function awaitsTeacher(question: Question) {
  const human = question.comments.filter((comment) => comment.role !== 'ai');
  if (!human.some((comment) => comment.role === 'student')) return false;
  return human[human.length - 1].role === 'student';
}

function inCourseScope(area: string, course: string, teachers: ListedPerson[]) {
  if (!course) return true;
  if (!CURATED_AREAS.has(area)) return true;
  return teachers.some((teacher) => teacher.course === course && teacherForArea(teacher.email, area));
}

export function buildCoordinatorReport(
  questions: Question[],
  exams: ExamRecord[],
  progress: Record<string, ProgressRecord>,
  people: ListedPerson[],
  filters: ReportFilters,
): CoordinatorReport {
  const teachers = people.filter((person) => person.role === 'teacher');
  const students = people.filter((person) => person.role === 'student' && courseMatch(person.course, filters.course));
  const visibleTeachers = teachers
    .filter((teacher) => courseMatch(teacher.course, filters.course))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));

  const slices = CLOSED_SLICES.filter((slice) => (
    slice.period === filters.period
    && courseMatch(slice.course, filters.course)
    && areaMatch(slice.area, filters.area)
  ));

  const totals = new Map<string, { answered: number; wrong: number }>();
  slices.forEach((slice) => {
    const current = totals.get(slice.area) || { answered: 0, wrong: 0 };
    current.answered += slice.answered;
    current.wrong += slice.wrong;
    totals.set(slice.area, current);
  });

  let finishedAttempts = CLOSED_SITTINGS
    .filter((sitting) => sitting.period === filters.period && courseMatch(sitting.course, filters.course))
    .reduce((sum, sitting) => sum + sitting.attempts, 0);

  if (filters.period === '2026.1') {
    students.forEach((student) => {
      const record = progress[student.email];
      if (!record) return;
      finishedAttempts += record.history.length;
      Object.entries(record.byArea).forEach(([area, stats]) => {
        if (!areaMatch(area, filters.area) || !inCourseScope(area, filters.course, teachers)) return;
        const current = totals.get(area) || { answered: 0, wrong: 0 };
        current.answered += stats.total;
        current.wrong += Math.max(0, stats.total - stats.correct);
        totals.set(area, current);
      });
    });
  }

  const openQuestions = questions.filter((question) => (
    awaitsTeacher(question)
    && areaMatch(question.area, filters.area)
    && inCourseScope(question.area, filters.course, teachers)
  ));
  const openByArea = new Map<string, { count: number; sample: string }>();
  openQuestions.forEach((question) => {
    const current = openByArea.get(question.area) || { count: 0, sample: question.text.replace(/\s+/g, ' ').trim() };
    current.count += 1;
    openByArea.set(question.area, current);
  });

  const competencies: CompetencyRow[] = Array.from(totals.entries())
    .map(([area, stats]) => ({
      area,
      answered: stats.answered,
      wrong: stats.wrong,
      errorPercent: stats.answered ? Math.round((stats.wrong / stats.answered) * 100) : 0,
      openDoubts: openByArea.get(area)?.count || 0,
    }))
    .sort((left, right) => right.errorPercent - left.errorPercent || left.area.localeCompare(right.area, 'pt-BR'));

  const themes: ThemeRow[] = Array.from(openByArea.entries())
    .map(([area, info]) => ({
      area,
      openDoubts: info.count,
      recurring: info.count >= 2,
      sample: info.sample.length > 140 ? `${info.sample.slice(0, 137)}...` : info.sample,
    }))
    .sort((left, right) => right.openDoubts - left.openDoubts || left.area.localeCompare(right.area, 'pt-BR'));

  const scopedQuestions = questions.filter((question) => (
    areaMatch(question.area, filters.area) && inCourseScope(question.area, filters.course, teachers)
  ));
  const teacherReplies = scopedQuestions.reduce(
    (total, question) => total + question.comments.filter((comment) => comment.role === 'teacher').length,
    0,
  );

  const teacherRows: TeacherRow[] = visibleTeachers.map((teacher) => {
    const areas = (CURATION[teacher.email] || []).filter((area) => areaMatch(area, filters.area));
    const questionsInCare = questions.filter((question) => {
      if (!areaMatch(question.area, filters.area)) return false;
      const curator = questionCurator(question, teachers);
      return curator?.email === teacher.email;
    });
    const replies = questionsInCare.reduce((total, question) => (
      total + question.comments.filter((comment) => comment.role === 'teacher' && comment.userName === teacher.name).length
    ), 0);
    const helpful = questionsInCare.reduce((total, question) => (
      total + question.comments
        .filter((comment) => comment.role === 'teacher' && comment.userName === teacher.name)
        .reduce((sum, comment) => sum + (comment.helpfulBy?.length || 0), 0)
    ), 0);
    const liveExams = exams.filter((exam) => (
      !exam.personal
      && exam.authorEmail === teacher.email
      && exam.period === filters.period
      && courseMatch(exam.course || teacher.course, filters.course)
    )).length;
    const closedExams = CLOSED_EXAMS.filter((exam) => (
      exam.authorEmail === teacher.email
      && exam.period === filters.period
      && courseMatch(exam.course, filters.course)
    )).length;
    return {
      name: teacher.name,
      course: teacher.course,
      specialty: teacher.specialty || 'Curadoria do ciclo',
      areas,
      questions: questionsInCare.length,
      exams: liveExams + closedExams,
      forumReplies: replies,
      helpful,
    };
  });

  const answered = competencies.reduce((sum, row) => sum + row.answered, 0);
  const wrong = competencies.reduce((sum, row) => sum + row.wrong, 0);
  const areaOptions = Array.from(new Set([
    ...CLOSED_SLICES.filter((slice) => slice.period === filters.period && courseMatch(slice.course, filters.course)).map((slice) => slice.area),
    ...questions.filter((question) => inCourseScope(question.area, filters.course, teachers)).map((question) => question.area),
  ])).sort((left, right) => left.localeCompare(right, 'pt-BR'));

  return {
    studentsOnList: students.length,
    finishedAttempts,
    answered,
    errorPercent: answered ? Math.round((wrong / answered) * 100) : null,
    openDoubts: openQuestions.length,
    teacherReplies,
    recurringThemes: themes.filter((theme) => theme.recurring).length,
    emptySimulados: answered === 0,
    competencies,
    themes,
    teachers: teacherRows,
    courseOptions: Array.from(new Set(people.filter((person) => person.role !== 'coordinator').map((person) => person.course))).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    areaOptions,
  };
}
