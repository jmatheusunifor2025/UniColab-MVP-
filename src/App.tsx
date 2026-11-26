import { useEffect, useState } from 'react';
import { Question, SessionUser, UserStats } from './types';
import Dashboard from './components/Dashboard';
import QuestionBank from './components/QuestionBank';
import Simulation from './components/Simulation';
import Forum from './components/Forum';
import TeacherArea from './components/TeacherArea';
import TeacherDashboard from './components/TeacherDashboard';
import TrilhaIA from './components/TrilhaIA';
import Login from './components/Login';
import ExamsLists from './components/ExamsLists';
import SettingsPanel from './components/SettingsPanel';
import { StudentShell, TeacherShell } from './components/Shell';
import { readToken } from './api/client';
import {
  addComment,
  closeExam,
  createQuestion,
  currentUser,
  gradePractice,
  listExams,
  loadAreas,
  deleteQuestion,
  loadQuestions,
  loadStudentStats,
  createPersonalExam,
  RemoteExam,
  signOut,
  startExam,
  StartedExam,
  submitExam,
} from './api/unicolab';

type AppTab = 'dashboard' | 'banco' | 'forum' | 'professor' | 'trilha' | 'painel' | 'provas' | 'config';

const EMPTY_STATS: UserStats = {
  points: 0,
  completedQuestionsCount: 0,
  correctCount: 0,
  history: [],
  badges: [],
  areas: [],
};

function readSession(): SessionUser | null {
  const saved = sessionStorage.getItem('unicolab_session') || localStorage.getItem('unicolab_session');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (!parsed?.username || !parsed?.displayName) return null;
    return {
      id: Number(parsed.id) || 0,
      username: parsed.username,
      displayName: parsed.displayName,
      role: parsed.role === 'teacher' ? 'teacher' : 'student',
      course: parsed.course || '',
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState<SessionUser | null>(() => (readToken() ? readSession() : null));
  const [activeTab, setActiveTab] = useState<AppTab>(() => (readSession()?.role === 'teacher' ? 'painel' : 'dashboard'));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [areaNames, setAreaNames] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [examSeed, setExamSeed] = useState<string[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [activeSimQuestions, setActiveSimQuestions] = useState<Question[] | null>(null);
  const [activeSimMinutes, setActiveSimMinutes] = useState(10);
  const [studentExams, setStudentExams] = useState<RemoteExam[]>([]);
  const [examRun, setExamRun] = useState<StartedExam | null>(null);
  const [banner, setBanner] = useState('');
  const [questionsReady, setQuestionsReady] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [activeForumQuestion, setActiveForumQuestion] = useState<Question | undefined>(undefined);

  const handleLogin = (user: SessionUser, persist: boolean) => {
    sessionStorage.removeItem('unicolab_session');
    localStorage.removeItem('unicolab_session');
    const store = persist ? localStorage : sessionStorage;
    store.setItem('unicolab_session', JSON.stringify(user));
    setLoggedInUser(user);
    setActiveTab(user.role === 'teacher' ? 'painel' : 'dashboard');
    setActiveSimQuestions(null);
    setExamRun(null);
    setStudentExams([]);
    setBanner('');
    setActiveForumQuestion(undefined);
    setEditingQuestion(null);
  };

  const handleLogout = () => {
    signOut();
    sessionStorage.removeItem('unicolab_session');
    localStorage.removeItem('unicolab_session');
    setLoggedInUser(null);
    setQuestions([]);
    setStats(EMPTY_STATS);
    setActiveSimQuestions(null);
    setExamRun(null);
    setStudentExams([]);
    setBanner('');
    setQuestionsReady(false);
    setCreatingExam(false);
  };

  useEffect(() => {
    if (!readToken()) return;
    let active = true;
    currentUser().then((user) => {
      if (!active) return;
      if (!user) {
        handleLogout();
        return;
      }
      setLoggedInUser(user);
      const store = localStorage.getItem('unicolab_session') ? localStorage : sessionStorage;
      store.setItem('unicolab_session', JSON.stringify(user));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loggedInUser) return;
    let active = true;
    setLoadError('');
    setQuestionsReady(false);
    (async () => {
      try {
        const [loaded, areas] = await Promise.all([loadQuestions(), loadAreas()]);
        if (!active) return;
        setQuestions(loaded);
        setAreaNames(areas.map((area) => area.nome));
        if (loggedInUser.role === 'student') {
          const [nextStats, exams] = await Promise.all([loadStudentStats(), listExams()]);
          if (!active) return;
          setStats(nextStats);
          setStudentExams(exams);
        }
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar os dados desta demonstração.');
      } finally {
        if (active) setQuestionsReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [loggedInUser?.username, loggedInUser?.role]);

  useEffect(() => {
    if (!loggedInUser) return;
    const allowed: AppTab[] = loggedInUser.role === 'teacher'
      ? ['painel', 'banco', 'forum', 'professor', 'provas', 'config']
      : ['dashboard', 'banco', 'forum', 'trilha'];
    if (!allowed.includes(activeTab)) {
      setActiveTab(loggedInUser.role === 'teacher' ? 'painel' : 'dashboard');
    }
  }, [loggedInUser, activeTab]);

  if (!loggedInUser) {
    return <Login onLogin={handleLogin} />;
  }

  const visibleQuestions = questions.filter((question) => !hiddenIds.includes(question.id));
  const isTeacher = loggedInUser.role === 'teacher';
  const bancaExams = studentExams.filter((exam) => !exam.personal);
  const eligibleQuestions = visibleQuestions.filter((question) => question.hasJustification).length;

  const handleCreatePersonalExam = async (quantidade: number) => {
    setLoadError('');
    setBanner('');
    setCreatingExam(true);
    try {
      const exam = await createPersonalExam(quantidade);
      setStudentExams((current) => [...current.filter((item) => item.id !== exam.id), exam]);
      const started = await startExam(Number(exam.id), visibleQuestions);
      setExamRun(started);
      setActiveSimQuestions(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível criar o simulado.');
    } finally {
      setCreatingExam(false);
    }
  };

  const handleFinishSimulation = async () => {
    if (!isTeacher) {
      try {
        setStats(await loadStudentStats());
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Falha ao atualizar o painel.');
      }
    }
    setActiveSimQuestions(null);
    setExamRun(null);
    setActiveTab('dashboard');
  };

  const handleStartExam = async (id: string) => {
    setLoadError('');
    setBanner('');
    try {
      const started = await startExam(Number(id), visibleQuestions);
      setExamRun(started);
      setActiveSimQuestions(null);
      setBanner(started.resumed ? `Havia um simulado em andamento. Retomamos "${started.title}".` : '');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível iniciar o simulado.');
    }
  };

  const handleDiscard = async () => {
    if (examRun) {
      if (!confirm('Encerrar este simulado? As questões em branco entram como erro e a tentativa fica no histórico.')) return;
      try {
        await closeExam(examRun.attemptId);
        setExamRun(null);
        setStats(await loadStudentStats());
        setActiveTab('dashboard');
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Não foi possível encerrar o simulado.');
      }
      return;
    }
    if (confirm('Deseja fechar a prática? Seu progresso parcial será perdido.')) setActiveSimQuestions(null);
  };

  const handleTeacherAddQuestion = async (newQuestionData: {
    text: string;
    type: string;
    area: string;
    year: number;
    difficulty: string;
    alternatives: string[];
    correctAlternative: number;
    justifications: string[];
    references: string;
  }) => {
    await createQuestion(newQuestionData);
    setQuestions(await loadQuestions());
  };

  const handleAddForumComment = async (questionId: string, _author: string, _role: 'student' | 'teacher', commentText: string) => {
    await addComment(questionId, commentText);
    setQuestions(await loadQuestions());
    if (!isTeacher) setStats(await loadStudentStats());
  };

  const openCadastro = (question?: Question | null) => {
    setEditingQuestion(question || null);
    setActiveTab('professor');
    setActiveSimQuestions(null);
  };

  const notice = (
    <>
      {banner && <p className="mb-4 rounded-xl bg-[#f3f1ff] px-3 py-2 text-sm text-brand">{banner}</p>}
      {loadError && <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{loadError}</p>}
    </>
  );

  const studentBody = examRun ? (
    <Simulation
      questions={examRun.questions}
      limitMinutes={studentExams.find((exam) => exam.id === String(examRun.simuladoId))?.minutes || 40}
      title={examRun.title}
      deadline={examRun.deadline}
      startedAt={examRun.startedAt}
      onCancel={handleDiscard}
      onGrade={(answers, elapsedSeconds) => submitExam(examRun.attemptId, examRun.questions, answers, elapsedSeconds)}
      onFinishSimulation={handleFinishSimulation}
    />
  ) : activeSimQuestions ? (
    <Simulation
      questions={activeSimQuestions}
      limitMinutes={activeSimMinutes}
      title="Prática avulsa"
      onCancel={handleDiscard}
      onGrade={(answers, elapsedSeconds) => gradePractice(activeSimQuestions, answers, elapsedSeconds)}
      onFinishSimulation={handleFinishSimulation}
    />
  ) : (
    <>
      {notice}
      {activeTab === 'dashboard' && (
        <Dashboard
          stats={stats}
          areas={stats.areas}
          displayName={loggedInUser.displayName}
          course={loggedInUser.course}
          exams={bancaExams.map((exam) => ({
            id: exam.id,
            title: exam.title,
            minutes: exam.minutes,
            questionCount: exam.questionCount,
          }))}
          onStartExam={handleStartExam}
          onSelectTrilha={() => setActiveTab('trilha')}
        />
      )}
      {activeTab === 'banco' && (
        <QuestionBank
          questions={visibleQuestions}
          variant="student"
          exams={bancaExams.map((exam) => ({
            id: exam.id,
            title: exam.title,
            minutes: exam.minutes,
            questionCount: exam.questionCount,
          }))}
          questionsReady={questionsReady}
          creatingPersonalExam={creatingExam}
          onCreatePersonalExam={handleCreatePersonalExam}
          onStartExam={handleStartExam}
          onExploreSingleQuestion={(question) => {
            setActiveSimMinutes(4);
            setActiveSimQuestions([question]);
          }}
        />
      )}
      {activeTab === 'forum' && (
        <Forum
          questions={visibleQuestions}
          activeQuestion={activeForumQuestion}
          authorName={loggedInUser.displayName}
          authorRole="student"
          onAddComment={handleAddForumComment}
        />
      )}
      {activeTab === 'trilha' && (
        <TrilhaIA
          stats={stats}
          studentName={loggedInUser.displayName}
          eligible={eligibleQuestions}
          questionsReady={questionsReady}
          creatingExam={creatingExam}
          onCreateExam={handleCreatePersonalExam}
        />
      )}
    </>
  );

  if (!isTeacher) {
    return (
      <StudentShell
        user={loggedInUser}
        points={stats.points}
        activeTab={activeTab === 'dashboard' || activeTab === 'banco' || activeTab === 'forum' || activeTab === 'trilha' ? activeTab : 'dashboard'}
        history={stats.history}
        onNavigate={(tab) => {
          setActiveSimQuestions(null);
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        simActive={Boolean(activeSimQuestions || examRun)}
        onDiscardSim={handleDiscard}
      >
        {studentBody}
      </StudentShell>
    );
  }

  return (
    <TeacherShell
      user={loggedInUser}
      activeTab={activeTab === 'painel' || activeTab === 'banco' || activeTab === 'provas' || activeTab === 'forum' || activeTab === 'config' || activeTab === 'professor' ? activeTab : 'painel'}
      onNavigate={(tab) => {
        if (tab !== 'professor') setEditingQuestion(null);
        setActiveTab(tab);
      }}
      onLogout={handleLogout}
    >
      {notice}
      {activeTab === 'painel' && (
        <TeacherDashboard
          displayName={loggedInUser.displayName}
          authorId={loggedInUser.id}
          questions={visibleQuestions}
          onCadastrar={() => openCadastro(null)}
          onOpenBank={() => setActiveTab('banco')}
          onOpenForum={(question) => {
            setActiveForumQuestion(question);
            setActiveTab('forum');
          }}
        />
      )}
      {activeTab === 'banco' && (
        <QuestionBank
          questions={visibleQuestions}
          variant="teacher"
          onOpenCadastro={() => openCadastro(null)}
          onEditQuestion={(question) => openCadastro(question)}
          onDeleteQuestion={async (id) => {
            await deleteQuestion(Number(id));
            setQuestions(await loadQuestions());
            setHiddenIds((current) => current.filter((item) => item !== id));
            setBanner('Questão apagada do banco.');
          }}
          onBuildExam={(ids) => {
            setExamSeed(ids);
            setActiveTab('provas');
          }}
        />
      )}
      {activeTab === 'provas' && <ExamsLists questions={visibleQuestions} seedIds={examSeed} />}
      {activeTab === 'forum' && (
        <Forum
          questions={visibleQuestions}
          activeQuestion={activeForumQuestion}
          authorName={loggedInUser.displayName}
          authorRole="teacher"
          onAddComment={handleAddForumComment}
        />
      )}
      {activeTab === 'professor' && (
        <TeacherArea
          initialQuestion={editingQuestion}
          existingQuestions={visibleQuestions}
          areas={areaNames}
          onAddQuestion={handleTeacherAddQuestion}
        />
      )}
      {activeTab === 'config' && <SettingsPanel user={loggedInUser} onLogout={handleLogout} />}
    </TeacherShell>
  );
}
