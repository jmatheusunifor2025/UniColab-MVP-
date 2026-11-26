import { useState, type ReactNode } from 'react';
import { UserStats } from '../types';
import { suggestTrailText } from '../api/unicolab';
import PersonalSimulado from './PersonalSimulado';
import { BookOpen, CalendarDays, RefreshCw, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';

interface TrilhaIAProps {
  stats: UserStats;
  studentName: string;
  eligible: number;
  questionsReady: boolean;
  creatingExam: boolean;
  onCreateExam: (quantidade: number) => void;
}

export default function TrilhaIA({ stats, studentName, eligible, questionsReady, creatingExam, onCreateExam }: TrilhaIAProps) {
  const [loading, setLoading] = useState(false);
  const [trilhaMarkdown, setTrilhaMarkdown] = useState<string | null>(null);
  const [error, setError] = useState('');

  const weakAreas = stats.areas.filter((item) => item.score < 75).map((item) => item.name);

  const handleGenerateTrilha = async () => {
    setLoading(true);
    setError('');
    const completed = stats.completedQuestionsCount;
    const scorePercent = completed > 0 ? Math.round((stats.correctCount / completed) * 100) : 0;
    try {
      const response = await fetch('/api/gemini/trilha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          wrongAreas: weakAreas,
          stats: { completedCount: completed, scorePercent },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.studyTrail) {
        throw new Error(data.error || 'O Gemini não devolveu a trilha.');
      }
      if (data.source !== 'gemini') {
        setError('A chave do Gemini não foi lida pelo servidor. Este texto é o plano local.');
      }
      setTrilhaMarkdown(data.studyTrail);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Não foi possível gerar a trilha com o Gemini.');
      try {
        setTrilhaMarkdown(await suggestTrailText(studentName));
      } catch {
        setTrilhaMarkdown(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#efe9ff_0%,#f6f2ff_55%,#e7e2ff_100%)] p-6 md:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Recurso de IA generativa
            </span>
            <h1 className="mt-4 max-w-lg text-3xl font-extrabold tracking-tight text-[#24145f] md:text-4xl">
              Trilhas de estudo inteligentes para o ENADE
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              A inteligência artificial da plataforma analisa os seus acertos e erros no banco de questões para gerar um plano dinâmico, focado nas maiores deficiências do aluno e ajustado à sua evolução.
            </p>
            <button
              type="button"
              onClick={handleGenerateTrilha}
              disabled={loading}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#24145f] px-5 text-sm font-semibold text-white hover:bg-[#1a0f48] disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Gerando trilha...' : 'Gerar minha trilha de estudo personalizada'}
            </button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Análise segura baseada apenas no seu desempenho acadêmico.
            </p>
          </div>
          <div className="relative hidden h-56 lg:block">
            <div className="absolute right-6 top-2 h-40 w-40 rounded-full border border-brand/15" />
            <div className="absolute right-14 top-8 h-28 w-28 rounded-full border border-dashed border-brand/25" />
            <FloatCard className="left-0 top-4" icon={<Stethoscope className="h-4 w-4" />} title="Diagnóstico do desempenho" />
            <FloatCard className="right-0 top-0" icon={<Sparkles className="h-4 w-4" />} title="Tutor virtual organiza prioridades" dark />
            <FloatCard className="bottom-2 left-8" icon={<CalendarDays className="h-4 w-4" />} title="Cronograma adaptativo" />
          </div>
        </div>
      </section>

      <PersonalSimulado eligible={eligible} ready={questionsReady} creating={creatingExam} onStart={onCreateExam} />

      <section className="rounded-[24px] border border-line bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold tracking-wide text-brand">Estado atual</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            {trilhaMarkdown ? 'Trilha gerada' : 'Aguardando geração'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 animate-pulse text-brand" />
            <p className="mt-3 font-semibold">O tutor está lendo o seu desempenho</p>
            <p className="mt-1 text-sm text-slate-500">Prioridades: {weakAreas.length > 0 ? weakAreas.join(', ') : 'o acervo ainda vai indicar as áreas fracas'}.</p>
          </div>
        ) : trilhaMarkdown ? (
          <div className="mt-5">
            {error && <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
            <h3 className="text-lg font-bold">Plano de estudos de {studentName}</h3>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">{trilhaMarkdown}</pre>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-slate-500">
              <span>Sugestão: 25 minutos por dia nas revisões deste plano.</span>
              <button type="button" onClick={handleGenerateTrilha} className="inline-flex items-center gap-1.5 font-semibold text-brand">
                <RefreshCw className="h-4 w-4" />
                Atualizar trilha
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f1ff] text-brand">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nenhuma trilha ativa</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
                Clique no botão do painel superior para submeter as suas estatísticas ao tutor virtual. Em poucos instantes, a IA cria o cronograma de apoio, com prioridades, metas e revisões.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FloatCard({ className, icon, title, dark = false }: { className: string; icon: ReactNode; title: string; dark?: boolean }) {
  return (
    <div className={`absolute ${className} flex max-w-[180px] items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-sm ${dark ? 'bg-[#3a246f] text-white' : 'bg-white text-ink'}`}>
      <span className={dark ? 'text-white' : 'text-brand'}>{icon}</span>
      {title}
    </div>
  );
}
