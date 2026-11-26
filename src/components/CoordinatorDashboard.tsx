import { useEffect, useState, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import { loadCoordinatorReport } from '../api/unicolab';
import { CoordinatorReport, CYCLE_PERIODS } from '../demo/cycle';

const EMPTY_SIMULADOS = 'Ainda não há simulados encerrados suficientes para consolidar o relatório neste recorte';

interface CoordinatorDashboardProps {
  displayName: string;
  homeCourse: string;
  tab: 'turma' | 'docentes';
}

const INITIAL: CoordinatorReport = {
  studentsOnList: 0,
  finishedAttempts: 0,
  answered: 0,
  errorPercent: null,
  openDoubts: 0,
  teacherReplies: 0,
  recurringThemes: 0,
  emptySimulados: true,
  competencies: [],
  themes: [],
  teachers: [],
  courseOptions: [],
  areaOptions: [],
};

export default function CoordinatorDashboard({ displayName, homeCourse, tab }: CoordinatorDashboardProps) {
  const [course, setCourse] = useState('');
  const [area, setArea] = useState('');
  const [period, setPeriod] = useState<string>(CYCLE_PERIODS[0]);
  const [report, setReport] = useState<CoordinatorReport>(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadCoordinatorReport({ course, area, period })
      .then((next) => {
        if (!active) return;
        setReport(next);
        setError('');
        if (area && !next.areaOptions.includes(area)) setArea('');
        if (next.courseOptions.length === 1 && course !== next.courseOptions[0]) setCourse(next.courseOptions[0]);
        else if (course && !next.courseOptions.includes(course)) setCourse('');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Acesso restrito à Coordenação de Curso.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [course, area, period]);

  const exportSummary = () => {
    const lines = [
      'UniColab — resumo da coordenação',
      `Curso vinculado: ${homeCourse}`,
      `Recorte: ${course || (report.courseOptions.length > 1 ? 'todos os cursos da coordenação' : report.courseOptions[0] || 'curso da coordenação')} · ${area || 'todas as competências'} · ${period}`,
      'Sem nota individual, sem ranking de docentes e sem sanção.',
      '',
      `Concluintes na lista: ${report.studentsOnList}`,
      `Tentativas encerradas: ${report.finishedAttempts}`,
      `Erro agregado: ${report.errorPercent === null ? 'sem simulados encerrados' : `${report.errorPercent}%`}`,
      `Dúvidas abertas: ${report.openDoubts}`,
      `Respostas docentes: ${report.teacherReplies}`,
      '',
      'Erro por competência',
      ...(report.emptySimulados
        ? [EMPTY_SIMULADOS]
        : report.competencies.map((row) => `${row.area}: ${row.errorPercent}% de erro em ${row.answered} respostas · ${row.openDoubts} dúvida(s) aberta(s)`)),
      '',
      'Participação docente',
      ...report.teachers.map((teacher) => `${teacher.name} · ${teacher.course} · ${teacher.specialty}: ${teacher.questions} questões na área, ${teacher.exams} simulados, ${teacher.forumReplies} respostas, ${teacher.helpful} marcações de utilidade`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unicolab-coordenacao-${period}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            Coordenação de curso <span className="text-brand">/ {tab === 'turma' ? 'Relatório da turma' : 'Participação docente'}</span>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Olá, {displayName}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {homeCourse}. O painel reúne o erro agregado da turma e o extrato de contribuição dos professores, para orientar o reforço antes do ENADE.
          </p>
        </div>
        <button type="button" onClick={exportSummary} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:bg-canvas">
          <Download className="h-4 w-4" />
          Exportar resumo
        </button>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Filter label="Curso" value={course} onChange={setCourse}>
          {report.courseOptions.length > 1 && <option value="">Todos os cursos da coordenação</option>}
          {report.courseOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Filter>
        <Filter label="Competência" value={area} onChange={setArea}>
          <option value="">Todas as competências</option>
          {report.areaOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Filter>
        <Filter label="Período" value={period} onChange={setPeriod}>
          {CYCLE_PERIODS.map((option) => <option key={option} value={option}>{option}</option>)}
        </Filter>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Concluintes na lista" value={String(report.studentsOnList)} hint="Contagem da lista institucional" />
        <Metric label="Tentativas encerradas" value={String(report.finishedAttempts)} hint="Somente simulados já finalizados" />
        <Metric label="Erro agregado" value={report.errorPercent === null ? '—' : `${report.errorPercent}%`} hint="Percentual do recorte, sem nota individual" />
        <Metric
          label="Dúvidas abertas"
          value={String(report.openDoubts)}
          hint={report.teacherReplies === 1 ? '1 resposta docente no recorte' : `${report.teacherReplies} respostas docentes no recorte`}
          alert={report.openDoubts > 0}
        />
      </section>

      {tab === 'turma' ? (
        <section className="grid items-start gap-4 lg:grid-cols-12">
          <div className="rounded-[24px] border border-line bg-white p-5 lg:col-span-8">
            <h2 className="font-bold">Onde a turma erra</h2>
            <p className="mt-1 text-xs text-slate-500">
              Percentual de erro por competência nos simulados encerrados de {period}. O fórum mostrado ao lado é o banco atual.
            </p>
            {loading ? (
              <p className="mt-5 text-sm text-slate-500">Carregando o resumo do ciclo...</p>
            ) : report.emptySimulados ? (
              <p className="mt-5 rounded-2xl bg-canvas px-4 py-8 text-center text-sm text-slate-600">{EMPTY_SIMULADOS}</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {report.competencies.map((row) => (
                  <li key={row.area}>
                    <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{row.area}</span>
                      <span className="shrink-0 font-semibold">{row.errorPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-brand" style={{ width: `${row.errorPercent}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.wrong} erros em {row.answered} respostas
                      {row.openDoubts > 0 ? ` · ${row.openDoubts} dúvida${row.openDoubts === 1 ? '' : 's'} ainda sem resposta docente` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-[24px] border border-line bg-white p-5">
              <h2 className="font-bold">Apoio no fórum</h2>
              <p className="mt-1 text-xs text-slate-500">
                {report.recurringThemes} tema{report.recurringThemes === 1 ? '' : 's'} com dúvida repetida. Os nomes dos estudantes não entram aqui.
              </p>
              {report.themes.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-canvas px-4 py-6 text-center text-sm text-slate-500">Nenhuma dúvida aguardando resposta neste recorte.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {report.themes.map((theme) => (
                    <li key={theme.area} className="rounded-2xl border border-line p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{theme.area}</p>
                        <span className="text-xs font-semibold text-brand">{theme.openDoubts}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{theme.sample}</p>
                      {theme.recurring && <p className="mt-2 text-xs font-medium text-amber-700">Tema recorrente para reforço com o professor da área.</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <aside className="rounded-[24px] bg-[#1a1033] p-5 text-sm text-white/80">
              <p className="font-semibold text-white">O que fica de fora</p>
              <p className="mt-2 leading-relaxed">Nota, nome e posição de cada estudante. O relatório serve ao planejamento do reforço com os professores.</p>
            </aside>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="rounded-[24px] border border-line bg-white p-5">
            <h2 className="font-bold">Extrato de contribuição do ciclo</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              A mesma leitura que o professor usa no dossiê: questões da área, simulados criados e respostas no fórum. A lista segue a ordem alfabética. Não há ranking, sanção nem caráter remuneratório.
            </p>
          </div>
          {report.teachers.map((teacher) => (
            <article key={teacher.name} className="rounded-[24px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{teacher.name}</h3>
                  <p className="text-sm text-slate-500">{teacher.course} · {teacher.specialty}</p>
                </div>
                <p className="text-xs text-slate-400">{period}</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Count label="Questões na área" value={teacher.questions} />
                <Count label="Simulados criados" value={teacher.exams} />
                <Count label="Respostas no fórum" value={teacher.forumReplies} />
                <Count label="Respostas marcadas como úteis" value={teacher.helpful} />
              </dl>
              {teacher.areas.length > 0 && (
                <p className="mt-4 text-xs leading-relaxed text-slate-500">Curadoria: {teacher.areas.join(', ')}.</p>
              )}
            </article>
          ))}
          <p className="text-xs text-slate-500">
            Itens de formação geral do acervo oficial aparecem no erro da turma e não recebem autoria nominal de um professor.
          </p>
        </section>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand"
      >
        {children}
      </select>
    </label>
  );
}

function Metric({ label, value, hint, alert = false }: { label: string; value: string; hint: string; alert?: boolean }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight ${alert ? 'text-amber-600' : 'text-ink'}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </article>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-canvas px-3 py-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold tracking-tight">{value}</dd>
    </div>
  );
}
