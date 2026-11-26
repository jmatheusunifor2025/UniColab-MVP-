import { Question, SessionUser, SimulationHistoryItem, UserStats } from '../types';
import { clearToken, readToken, writeToken } from '../api/client';
import { courseLabel, findListed, LISTED_PEOPLE, ListedPerson } from './roster';
import { seedQuestions } from './questions';

const STATE_KEY = 'unicolab_mvp_state';

interface AttemptRecord {
  userEmail: string;
  examId: number;
  title: string;
  startedAt: string;
  deadline: string;
  status: 'open' | 'done';
  questionIds: string[];
}

interface Progress {
  history: SimulationHistoryItem[];
  resolved: number;
  correct: number;
  byArea: Record<string, { total: number; correct: number }>;
}

interface DemoState {
  passwords: Record<string, string>;
  questions: Question[];
  exams: Array<{
    id: string;
    title: string;
    minutes: number;
    questionCount: number;
    questionIds: string[];
    personal?: boolean;
    ownerEmail?: string;
  }>;
  nextExamId: number;
  nextAttemptId: number;
  attempts: Record<string, AttemptRecord>;
  progress: Record<string, Progress>;
}

function emptyProgress(): Progress {
  return { history: [], resolved: 0, correct: 0, byArea: {} };
}

function freshState(): DemoState {
  const questions = seedQuestions();
  return {
    passwords: {},
    questions,
    exams: [
      {
        id: '1',
        title: 'Simulado ENADE — Computação',
        minutes: 40,
        questionCount: 10,
        questionIds: questions.slice(0, 10).map((question) => question.id),
      },
    ],
    nextExamId: 2,
    nextAttemptId: 1,
    attempts: {},
    progress: {},
  };
}

function readState(): DemoState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed?.questions?.length || !parsed.exams) return freshState();
    parsed.passwords = parsed.passwords || {};
    parsed.attempts = parsed.attempts || {};
    parsed.progress = parsed.progress || {};
    const ids = new Set(parsed.questions.map((question) => question.id));
    const missing = seedQuestions().filter((question) => question.id.startsWith('db-') && !ids.has(question.id));
    if (missing.length > 0) {
      parsed.questions = [...parsed.questions, ...missing];
      writeState(parsed);
    }
    return parsed;
  } catch {
    return freshState();
  }
}

function writeState(state: DemoState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function personFromToken(): ListedPerson | null {
  const token = readToken();
  if (!token?.startsWith('local:')) return null;
  return findListed(token.slice('local:'.length)) || null;
}

function toSession(person: ListedPerson): SessionUser {
  return {
    id: person.id,
    username: person.email,
    displayName: person.name,
    role: person.role === 'teacher' ? 'teacher' : 'student',
    course: courseLabel(person),
  };
}

function progressOf(state: DemoState, email: string) {
  if (!state.progress[email]) state.progress[email] = emptyProgress();
  return state.progress[email];
}

function recordResult(email: string, title: string, questions: Question[], answers: Record<string, number>, elapsedSeconds: number) {
  const state = readState();
  const progress = progressOf(state, email);
  const areasStats: Record<string, { total: number; correct: number }> = {};
  let correctAnswers = 0;
  questions.forEach((question) => {
    const chosen = answers[question.id];
    const correct = chosen !== undefined && chosen === question.correctAlternative;
    if (correct) correctAnswers += 1;
    if (!areasStats[question.area]) areasStats[question.area] = { total: 0, correct: 0 };
    areasStats[question.area].total += 1;
    if (correct) areasStats[question.area].correct += 1;
    if (!progress.byArea[question.area]) progress.byArea[question.area] = { total: 0, correct: 0 };
    progress.byArea[question.area].total += 1;
    if (correct) progress.byArea[question.area].correct += 1;
    if (chosen !== undefined) {
      progress.resolved += 1;
      if (correct) progress.correct += 1;
    }
  });
  progress.history.unshift({
    id: `h-${Date.now()}`,
    title,
    date: new Date().toLocaleDateString('pt-BR'),
    durationSeconds: elapsedSeconds,
    totalQuestions: questions.length,
    correctAnswers,
    scorePercent: questions.length ? Math.round((correctAnswers / questions.length) * 100) : 0,
    areasStats,
  });
  writeState(state);
}

function notesFor(questions: Question[]) {
  const key: Record<string, number> = {};
  const notes: Record<string, string> = {};
  questions.forEach((question) => {
    key[question.id] = question.correctAlternative;
    const lines = (question.justifications || []).map((text, index) => (text ? `${String.fromCharCode(65 + index)}. ${text}` : ''));
    notes[question.id] = lines.filter(Boolean).join('\n') || question.commentary;
  });
  return { key, notes };
}

export function listedPeople() {
  return LISTED_PEOPLE.map((person) => ({
    email: person.email,
    name: person.name,
    role: person.role,
    course: person.course,
    specialty: person.specialty || '',
  }));
}

export function accountHasPassword(email: string) {
  const person = findListed(email);
  if (!person) return false;
  return Boolean(readState().passwords[person.email]);
}

export async function activateAccount(email: string, senha: string, persist: boolean) {
  const person = findListed(email);
  if (!person) throw new Error('Este e-mail não está na lista enviada pela universidade.');
  const state = readState();
  state.passwords[person.email] = senha;
  writeState(state);
  return signIn(person.email, senha, persist);
}

export async function signIn(identificador: string, senha: string, persist: boolean) {
  const person = findListed(identificador);
  if (!person) throw new Error('E-mail ou senha não conferem.');
  const state = readState();
  if (!state.passwords[person.email]) {
    throw new Error('Esta conta ainda não tem senha. Comece pelo primeiro acesso.');
  }
  if (state.passwords[person.email] !== senha) throw new Error('E-mail ou senha não conferem.');
  writeToken(`local:${person.email}`, persist);
  return toSession(person);
}

export async function currentUser() {
  const person = personFromToken();
  if (!person) return null;
  if (!readState().passwords[person.email]) {
    clearToken();
    return null;
  }
  return toSession(person);
}

export function signOut() {
  clearToken();
}

export async function listPublicCourses() {
  const names = Array.from(new Set(LISTED_PEOPLE.map((person) => person.course)));
  return names.map((nome, index) => ({ id: index + 1, nome }));
}

export async function loadAreas() {
  const names = Array.from(new Set(readState().questions.map((question) => question.area)));
  return names.map((nome, index) => ({
    id: index + 1,
    nome,
    componente: nome.includes('ESG') || nome.includes('Ética') ? 'formacao_geral' : 'componente_especifico',
  }));
}

export async function loadQuestions() {
  return readState().questions.map((question) => ({ ...question, comments: [...question.comments] }));
}

export async function deleteQuestion(id: number) {
  const person = personFromToken();
  if (!person || person.role !== 'teacher') throw new Error('Só o professor apaga questão do banco.');
  const state = readState();
  const next = state.questions.filter((question) => question.id !== String(id));
  if (next.length === state.questions.length) throw new Error('Questão não encontrada.');
  state.questions = next;
  writeState(state);
}

export async function addComment(questionId: string, mensagem: string) {
  const person = personFromToken();
  if (!person) throw new Error('Entre para comentar.');
  const text = mensagem.trim();
  if (!text) throw new Error('Escreva a dúvida antes de publicar.');
  const state = readState();
  const question = state.questions.find((item) => item.id === questionId);
  if (!question) throw new Error('Questão não encontrada.');
  question.comments.push({
    id: `c-${Date.now()}`,
    userName: person.name,
    role: person.role === 'teacher' ? 'teacher' : 'student',
    text,
    timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }).slice(0, 16),
  });
  writeState(state);
}

export async function gradePractice(questions: Question[], answers: Record<string, number>, elapsedSeconds: number) {
  const person = personFromToken();
  if (person) recordResult(person.email, 'Prática avulsa', questions, answers, elapsedSeconds);
  return notesFor(questions);
}

export async function loadStudentStats(): Promise<UserStats> {
  const person = personFromToken();
  const progress = person ? readState().progress[person.email] || emptyProgress() : emptyProgress();
  const badges = [];
  if (progress.correct >= 1) {
    badges.push({
      id: 'primeiro-acerto',
      title: 'Primeiro acerto',
      description: 'Acertou ao menos uma questão nesta preparação.',
      icon: 'Award',
      unlockedAt: progress.history[progress.history.length - 1]?.date,
    });
  }
  if (progress.history.length >= 1) {
    badges.push({
      id: 'primeira-sessao',
      title: 'Primeira sessão',
      description: 'Concluiu uma prática ou um simulado.',
      icon: 'Trophy',
      unlockedAt: progress.history[0]?.date,
    });
  }
  const areas = Object.entries(progress.byArea).map(([name, value]) => ({
    name,
    score: value.total ? Math.round((value.correct / value.total) * 100) : 0,
  }));
  return {
    points: progress.correct * 10,
    completedQuestionsCount: progress.resolved,
    correctCount: progress.correct,
    history: progress.history,
    badges,
    areas,
  };
}

export async function suggestTrailText(studentName: string) {
  const stats = await loadStudentStats();
  const weak = [...stats.areas].sort((left, right) => left.score - right.score).slice(0, 3);
  const lines = weak.length
    ? weak.map((area, index) => `${index + 1}. ${area.name} (${area.score}% de acerto) — revise a justificativa das questões dessa área e refaça uma prática curta.`)
    : [
        '1. Padrões de Projeto & Engenharia de Software — comece pelo Singleton e pelo backlog do Scrum.',
        '2. Algoritmos & Estruturas de Dados — revise árvore balanceada e mergesort.',
        '3. Engenharia de Bancos de Dados Relacionais — reforce 3FN e INNER JOIN.',
      ];
  return [`Trilha de estudo`, `Plano de ${studentName}`, '', ...lines].join('\n');
}

export async function createQuestion(input: {
  text: string;
  type?: string;
  area: string;
  year: number;
  difficulty: string;
  alternatives: string[];
  correctAlternative: number;
  justifications: string[];
  references: string;
}) {
  const person = personFromToken();
  if (!person || person.role !== 'teacher') throw new Error('Só o professor cadastra questão.');
  const state = readState();
  const id = String(Date.now());
  const difficulty = input.difficulty === 'facil' || input.difficulty === 'dificil' ? input.difficulty : 'medio';
  const justifications = input.justifications.map((text) => text.trim());
  state.questions.unshift({
    id,
    text: input.text.trim(),
    type: input.type === 'geral' ? 'geral' : 'especifico',
    area: input.area,
    year: input.year,
    difficulty,
    alternatives: input.alternatives,
    alternativeIds: input.alternatives.map((_, index) => Date.now() + index),
    correctAlternative: input.correctAlternative,
    justifications,
    hasJustification: justifications.filter((text) => text.length >= 10).length >= 4,
    commentary: justifications[input.correctAlternative] || '',
    references: input.references,
    comments: [],
    authorId: person.id,
  });
  writeState(state);
}

export async function listExams() {
  const person = personFromToken();
  return readState().exams.filter((exam) => !exam.personal || exam.ownerEmail === person?.email);
}

export async function createPersonalExam(quantidade: number) {
  const person = personFromToken();
  if (!person) throw new Error('Entre para montar o simulado.');
  const state = readState();
  const pool = state.questions.filter((question) => question.hasJustification);
  if (pool.length < quantidade) throw new Error('Não há questões suficientes com justificativa.');
  const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, quantidade);
  const exam = {
    id: String(state.nextExamId),
    title: `Meu simulado de ${quantidade} questões`,
    minutes: quantidade * 3,
    questionCount: chosen.length,
    questionIds: chosen.map((question) => question.id),
    personal: true,
    ownerEmail: person.email,
  };
  state.nextExamId += 1;
  state.exams.push(exam);
  writeState(state);
  return exam;
}

export async function startExam(simuladoId: number, known: Question[]) {
  const person = personFromToken();
  if (!person) throw new Error('Entre para iniciar o simulado.');
  const state = readState();
  const exam = state.exams.find((item) => Number(item.id) === simuladoId);
  if (!exam) throw new Error('Simulado não encontrado.');
  const open = Object.entries(state.attempts).find(([, attempt]) => (
    attempt.userEmail === person.email && attempt.examId === simuladoId && attempt.status === 'open'
  ));
  const byId = new Map(known.map((question) => [question.id, question]));
  const questions = (open ? open[1].questionIds : exam.questionIds)
    .map((id) => byId.get(id) || state.questions.find((question) => question.id === id))
    .filter((question): question is Question => Boolean(question));
  if (open) {
    return {
      attemptId: Number(open[0]),
      simuladoId,
      title: open[1].title,
      startedAt: open[1].startedAt,
      deadline: open[1].deadline,
      questions,
      resumed: true,
    };
  }
  const attemptId = state.nextAttemptId;
  state.nextAttemptId += 1;
  const startedAt = new Date().toISOString();
  const deadline = new Date(Date.now() + exam.minutes * 60 * 1000).toISOString();
  state.attempts[String(attemptId)] = {
    userEmail: person.email,
    examId: simuladoId,
    title: exam.title,
    startedAt,
    deadline,
    status: 'open',
    questionIds: questions.map((question) => question.id),
  };
  writeState(state);
  return { attemptId, simuladoId, title: exam.title, startedAt, deadline, questions, resumed: false };
}

export async function submitExam(attemptId: number, questions: Question[], answers: Record<string, number>, elapsedSeconds: number) {
  const person = personFromToken();
  const state = readState();
  const attempt = state.attempts[String(attemptId)];
  if (attempt) {
    attempt.status = 'done';
    writeState(state);
  }
  if (person) recordResult(person.email, attempt?.title || 'Simulado', questions, answers, elapsedSeconds);
  return notesFor(questions);
}

export async function closeExam(attemptId: number) {
  const state = readState();
  const attempt = state.attempts[String(attemptId)];
  if (!attempt || attempt.status === 'done') return;
  attempt.status = 'done';
  writeState(state);
  const questions = attempt.questionIds
    .map((id) => state.questions.find((question) => question.id === id))
    .filter((question): question is Question => Boolean(question));
  recordResult(attempt.userEmail, attempt.title, questions, {}, 0);
}

export async function createExam(title: string, minutes: number, questionIds: string[]) {
  const person = personFromToken();
  if (!person || person.role !== 'teacher') throw new Error('Só o professor grava prova.');
  const state = readState();
  const exam = {
    id: String(state.nextExamId),
    title,
    minutes,
    questionCount: questionIds.length,
    questionIds,
  };
  state.nextExamId += 1;
  state.exams.unshift(exam);
  writeState(state);
  return exam;
}
