import { Question } from '../types';
import { BookOpen, MessageSquare, Plus } from 'lucide-react';

interface TeacherDashboardProps {
  displayName: string;
  authorId: number;
  questions: Question[];
  onCadastrar: () => void;
  onOpenForum: (question?: Question) => void;
  onOpenBank: () => void;
}

function awaitsTeacher(question: Question) {
  const human = question.comments.filter((comment) => comment.role !== 'ai');
  if (!human.some((comment) => comment.role === 'student')) return false;
  return human[human.length - 1].role === 'student';
}

export default function TeacherDashboard({ displayName, authorId, questions, onCadastrar, onOpenForum, onOpenBank }: TeacherDashboardProps) {
  const authored = questions.filter((question) => question.authorId != null && question.authorId === authorId);
  const pending = questions.filter(awaitsTeacher);
  const teacherReplies = questions.reduce(
    (total, question) => total + question.comments.filter((comment) => comment.role === 'teacher').length,
    0
  );
  const areas = Array.from(
    questions.reduce((map, question) => {
      map.set(question.area, (map.get(question.area) || 0) + 1);
      return map;
    }, new Map<string, number>())
  ).sort((left, right) => right[1] - left[1]);
  const maxArea = areas[0]?.[1] || 1;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Espaço do professor <span className="text-brand">/ Painel</span></p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Olá, {displayName}</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Curadoria pedagógica da UniColab. Cadastre questões no padrão ENADE, monte provas e responda às dúvidas dos estudantes.
          </p>
        </div>
        <button type="button" onClick={onCadastrar} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" />
          Nova questão
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Questões no banco" value={questions.length} />
        <Metric label="Cadastradas por você" value={authored.length} />
        <Metric label="Dúvidas em aberto" value={pending.length} alert={pending.length > 0} />
        <Metric label="Respostas docentes" value={teacherReplies} />
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-12">
        <div className="rounded-[24px] border border-line bg-white p-5 lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f1ff] text-brand">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold">Dúvidas aguardando o corpo docente</h2>
                <p className="text-xs text-slate-500">O último comentário humano ainda é de um estudante.</p>
              </div>
            </div>
            <span className="rounded-full bg-[#f3f1ff] px-2.5 py-1 text-xs font-semibold text-brand">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-canvas px-4 py-8 text-center text-sm text-slate-500">
              Nenhuma dúvida aguardando resposta.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.map((question) => {
                const lastStudent = [...question.comments].reverse().find((comment) => comment.role === 'student');
                return (
                  <li key={question.id} className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-brand">{question.area}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium">{question.text}</p>
                      {lastStudent && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{lastStudent.userName}: {lastStudent.text}</p>}
                    </div>
                    <button type="button" onClick={() => onOpenForum(question)} className="h-10 shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white">
                      Responder
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[24px] border border-line bg-white p-5 lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f1ff] text-brand">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold">Cobertura do banco</h2>
              <p className="text-xs text-slate-500">Questões por área temática</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {areas.map(([area, count]) => (
              <li key={area}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-slate-700">{area}</span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-brand" style={{ width: `${(count / maxArea) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onOpenBank} className="mt-5 h-10 w-full rounded-xl border border-line text-sm font-semibold hover:bg-canvas">
            Revisar gabaritos
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight ${alert ? 'text-amber-600' : 'text-ink'}`}>{value}</p>
    </article>
  );
}
