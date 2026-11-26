import { useState, type ReactNode } from 'react';
import { UserStats } from '../types';
import { Award, BookOpen, Clock, Lock, Play, Sparkles, Target, Trophy } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
  areas: { name: string; score: number }[];
  displayName: string;
  course: string;
  exams: { id: string; title: string; minutes: number; questionCount: number }[];
  onStartExam: (id: string) => void;
  onSelectTrilha: () => void;
}

function barColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-[#5b6cff]';
  return 'bg-rose-500';
}

function textColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-[#4d5ef0]';
  return 'text-rose-600';
}

function Ring({ value }: { value: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#3dde9a"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none">{value}%</span>
        <span className="mt-1 text-[11px] text-white/70">prontidão</span>
      </div>
    </div>
  );
}

export default function Dashboard({ stats, areas, displayName, course, exams, onStartExam, onSelectTrilha }: DashboardProps) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const totalSimulados = stats.history.length;
  const avgScore = stats.completedQuestionsCount > 0
    ? Math.round((stats.correctCount / stats.completedQuestionsCount) * 100)
    : 0;
  const focusSeconds = stats.history.reduce((acc, item) => acc + item.durationSeconds, 0);
  const focusMinutes = focusSeconds >= 60;
  const unlocked = stats.badges.filter((badge) => badge.unlockedAt).length;
  const strong = areas.filter((item) => item.score >= 80);
  const weak = areas.filter((item) => item.score < 75);
  const visibleHistory = showAllHistory ? stats.history : stats.history.slice(0, 2);
  const greeting = displayName === 'Vládia' ? 'Bem-vinda de volta, Vládia' : `Bem-vindo de volta, ${displayName}`;
  const courseLabel = course === 'Eng. Computação' ? 'Engenharia de Computação' : course;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(115deg,#2a1768_0%,#4a2cb8_52%,#6a45e6_100%)] px-6 py-7 text-white shadow-sm md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Perfil ENADE ativo
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{greeting}</h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75">
              Estudante de {courseLabel}. Seu progresso e as discussões com o corpo docente estão calibrados para o sucesso no ENADE.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {exams.length === 0 && (
                <p className="text-sm text-white/80">Nenhuma prova publicada pela banca.</p>
              )}
              {exams.map((exam) => (
                <button key={exam.id} type="button" onClick={() => onStartExam(exam.id)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-ink">
                  <Play className="h-4 w-4 fill-current" />
                  Iniciar {exam.title}
                </button>
              ))}
              <button type="button" onClick={onSelectTrilha} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/20">
                <Sparkles className="h-4 w-4" />
                Ver minha trilha IA
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Ring value={avgScore} />
            <p className="mt-1 text-xs text-white/70">Meta: 85% até a prova</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Trophy className="h-4 w-4" />} tint="bg-amber-50 text-amber-600" label="Pontuação geral" value={stats.points.toLocaleString('pt-BR')} suffix="XP" note="nesta conta" />
        <StatCard icon={<BookOpen className="h-4 w-4" />} tint="bg-[#eef0ff] text-brand" label="Questões respondidas" value={String(stats.completedQuestionsCount)} suffix="praticadas" note="no banco e nos simulados" />
        <StatCard icon={<Target className="h-4 w-4" />} tint="bg-emerald-50 text-emerald-600" label="Média de acertos" value={`${avgScore}%`} suffix="geral" note="média dos simulados" />
        <StatCard icon={<Clock className="h-4 w-4" />} tint="bg-sky-50 text-sky-600" label="Tempo de foco" value={focusMinutes ? String(Math.round(focusSeconds / 60)) : String(focusSeconds)} suffix={focusMinutes ? "min" : "s"} note="soma dos simulados" />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#ddd8ff] bg-[#f7f5ff] p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            <span className="font-semibold text-ink">Recomendação da trilha. </span>
            {areas.length === 0 && 'Resolva questões do banco para o painel usar o seu desempenho real.'}
            {strong.length > 0 && (
              <>
                Você está indo bem em{' '}
                {strong.map((item, index) => (
                  <span key={item.name}>
                    <span className="font-semibold text-emerald-600">{item.name} ({item.score}%)</span>
                    {index < strong.length - 1 ? ' e ' : '. '}
                  </span>
                ))}
              </>
            )}
            {weak.length > 0 && (
              <>
                Para subir a média, foque em{' '}
                {weak.map((item, index) => (
                  <span key={item.name}>
                    <span className="font-semibold text-rose-600">{item.name}</span>
                    {index < weak.length - 1 ? ', ' : '.'}
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
        <button type="button" onClick={onSelectTrilha} className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          Gerar cronograma
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-[24px] border border-line bg-white p-5 lg:col-span-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef0ff] text-brand">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold">Desempenho por competência</h2>
                <p className="text-xs text-slate-500">Proficiência atual por área temática do ENADE</p>
              </div>
            </div>
            <span className="rounded-full bg-[#f3f1ff] px-2.5 py-1 text-[11px] font-semibold text-brand">{areas.length} temas monitorados</span>
          </div>
          <div className="mt-5 space-y-4">
            {areas.length === 0 && <p className="text-sm text-slate-500">Nenhuma competência calculada ainda.</p>}
            {areas.map((item) => (
              <div key={item.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className={`font-semibold ${textColor(item.score)}`}>{item.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${barColor(item.score)}`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-line pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Excelente (≥ 80%)</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#5b6cff]" /> Intermediário (60–79%)</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" /> Atenção (&lt; 60%)</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-line bg-white p-5 lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold">Conquistas</h2>
              <p className="text-xs text-slate-500">{unlocked} de {stats.badges.length} medalhas desbloqueadas</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${(unlocked / Math.max(stats.badges.length, 1)) * 100}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {stats.badges.map((badge) => {
              const open = Boolean(badge.unlockedAt);
              return (
                <div key={badge.id} className={`rounded-2xl p-3 text-center ${open ? 'bg-[#fff8ee] ring-1 ring-amber-100' : 'border border-dashed border-slate-200 bg-slate-50/60'}`}>
                  <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${open ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {open ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <p className={`mt-2 text-xs font-semibold ${open ? 'text-ink' : 'text-slate-400'}`}>{badge.title}</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-line bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold">Histórico de simulados</h2>
              <p className="text-xs text-slate-500">Seus últimos simulados cronometrados</p>
            </div>
          </div>
          {stats.history.length > 2 && (
            <button type="button" onClick={() => setShowAllHistory((value) => !value)} className="text-sm font-semibold text-brand">
              {showAllHistory ? 'Ver menos' : 'Ver todos'}
            </button>
          )}
        </div>
        {totalSimulados === 0 ? (
          <p className="mt-6 rounded-2xl bg-canvas px-4 py-8 text-center text-sm text-slate-500">
            Nenhum simulado registrado. Comece um para ver o progresso.
          </p>
        ) : (
          <>
          <div className="mt-4 space-y-3 md:hidden">
            {visibleHistory.map((item) => (
              <article key={item.id} className="rounded-2xl border border-line px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.date}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.totalQuestions > 0 ? `${item.correctAnswers} de ${item.totalQuestions} questões` : (item.title || 'Prática')}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.scorePercent >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {item.scorePercent >= 70 ? 'Aprovado' : 'Revisar'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 min-w-0 flex-1 rounded-full bg-slate-100">
                    <div className={`h-1.5 rounded-full ${barColor(item.scorePercent)}`} style={{ width: `${item.scorePercent}%` }} />
                  </div>
                  <span className="text-xs font-semibold">{item.scorePercent}%</span>
                  <span className="text-xs text-slate-500">{Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s</span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold tracking-wide text-slate-400">
                  <th className="px-3 py-2 font-semibold">Data</th>
                  <th className="px-3 py-2 font-semibold">Aproveitamento</th>
                  <th className="px-3 py-2 font-semibold">Desempenho</th>
                  <th className="px-3 py-2 font-semibold">Tempo</th>
                  <th className="px-3 py-2 font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {visibleHistory.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-3 py-3 font-medium">{item.date}</td>
                    <td className="px-3 py-3 text-slate-600">{item.totalQuestions > 0 ? `${item.correctAnswers} de ${item.totalQuestions} questões` : (item.title || 'Prática')}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-slate-100">
                          <div className={`h-1.5 rounded-full ${barColor(item.scorePercent)}`} style={{ width: `${item.scorePercent}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{item.scorePercent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.scorePercent >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.scorePercent >= 70 ? 'Aprovado' : 'Revisar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, tint, label, value, suffix, note }: { icon: ReactNode; tint: string; label: string; value: string; suffix: string; note: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>{icon}</div>
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">
        {value} <span className="text-sm font-semibold text-slate-400">{suffix}</span>
      </p>
      <p className="mt-1 text-xs font-medium text-emerald-600">{note}</p>
    </article>
  );
}
