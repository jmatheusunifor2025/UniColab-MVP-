import { useMemo, useState, type ReactNode } from 'react';
import { Question } from '../types';
import PersonalSimulado from './PersonalSimulado';
import { ChevronLeft, ChevronRight, Clock, Eye, Pencil, Play, Plus, Search, Trash2, X } from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  variant?: 'student' | 'teacher';
  exams?: { id: string; title: string; minutes: number; questionCount: number }[];
  onStartExam?: (id: string) => void;
  onExploreSingleQuestion?: (question: Question) => void;
  onOpenCadastro?: () => void;
  onEditQuestion?: (question: Question) => void;
  onDeleteQuestion?: (id: string) => Promise<void> | void;
  onBuildExam?: (ids: string[]) => void;
  questionsReady?: boolean;
  creatingPersonalExam?: boolean;
  onCreatePersonalExam?: (quantidade: number) => void;
}

const DIFFICULTY_LABEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' } as const;
const PAGE_SIZE = 6;

function difficultyClass(level: Question['difficulty']) {
  if (level === 'facil') return 'bg-emerald-50 text-emerald-700';
  if (level === 'medio') return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

export default function QuestionBank({
  questions,
  variant = 'student',
  exams = [],
  onStartExam,
  onExploreSingleQuestion,
  onOpenCadastro,
  onEditQuestion,
  onDeleteQuestion,
  onBuildExam,
  questionsReady = false,
  creatingPersonalExam = false,
  onCreatePersonalExam,
}: QuestionBankProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'geral' | 'especifico'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'facil' | 'medio' | 'dificil'>('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sort, setSort] = useState<'recentes' | 'antigas' | 'enunciado'>('recentes');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<Question | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Question | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const areas = useMemo(() => Array.from(new Set(questions.map((question) => question.area))).sort(), [questions]);
  const years = useMemo(
    () => Array.from(new Set(questions.map((question) => String(question.year)))).sort((a, b) => Number(b) - Number(a)),
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = questions.filter((question) => {
      const matchesSearch = !term || question.text.toLowerCase().includes(term) || question.area.toLowerCase().includes(term);
      const matchesArea = areaFilter === 'all' || question.area === areaFilter;
      const matchesType = typeFilter === 'all' || question.type === typeFilter;
      const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
      const matchesYear = yearFilter === 'all' || String(question.year) === yearFilter;
      return matchesSearch && matchesArea && matchesType && matchesDifficulty && matchesYear;
    });
    return list.sort((left, right) => {
      if (sort === 'enunciado') return left.text.localeCompare(right.text, 'pt-BR');
      const yearDelta = sort === 'recentes' ? right.year - left.year : left.year - right.year;
      return yearDelta || left.id.localeCompare(right.id);
    });
  }, [questions, searchTerm, areaFilter, typeFilter, difficultyFilter, yearFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filteredQuestions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allPageSelected = pageItems.length > 0 && pageItems.every((question) => selected.includes(question.id));

  const clearFilters = () => {
    setSearchTerm('');
    setAreaFilter('all');
    setTypeFilter('all');
    setDifficultyFilter('all');
    setYearFilter('all');
    setPage(1);
  };

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const togglePage = () => {
    setSelected((current) => {
      if (allPageSelected) return current.filter((id) => !pageItems.some((question) => question.id === id));
      return Array.from(new Set([...current, ...pageItems.map((question) => question.id)]));
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {variant === 'teacher' && <p className="text-sm text-slate-400">Área acadêmica <span className="text-brand">/ Banco de questões</span></p>}
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Banco de questões</h1>
          <p className="mt-1 text-sm text-slate-500">
            {variant === 'teacher'
              ? 'Encontre, organize e reutilize questões nas suas avaliações.'
              : 'Treine questões do ENADE e monte um simulado cronometrado.'}
          </p>
        </div>
        {variant === 'teacher' && onOpenCadastro && (
          <button type="button" onClick={onOpenCadastro} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
            <Plus className="h-4 w-4" />
            Nova questão
          </button>
        )}
      </header>

      {variant === 'student' && (
        <section className="rounded-[24px] border border-line bg-white p-4 md:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-brand" />
            Provas da banca
          </div>
          <p className="mt-1 text-xs text-slate-500">O tempo e as questões vêm do simulado desta demonstração.</p>
          {exams.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nenhuma prova publicada.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {exams.map((exam) => (
                <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                  <div>
                    <p className="font-semibold">{exam.title}</p>
                    <p className="text-xs text-slate-500">{exam.questionCount} questões · {exam.minutes} min</p>
                  </div>
                  <button type="button" onClick={() => onStartExam?.(exam.id)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white">
                    <Play className="h-4 w-4 fill-current" />
                    Iniciar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {variant === 'student' && onCreatePersonalExam && (
        <PersonalSimulado
          eligible={questions.filter((question) => question.hasJustification).length}
          ready={questionsReady}
          creating={creatingPersonalExam}
          onStart={onCreatePersonalExam}
        />
      )}

      <section className="rounded-[24px] border border-line bg-white p-4 md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
            placeholder="Pesquisar por enunciado ou palavra-chave"
            className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Select label="Área" value={areaFilter} onChange={(value) => { setAreaFilter(value); setPage(1); }}>
            <option value="all">Todas as áreas</option>
            {areas.map((area) => <option key={area} value={area}>{area}</option>)}
          </Select>
          <Select label="Ano" value={yearFilter} onChange={(value) => { setYearFilter(value); setPage(1); }}>
            <option value="all">Todos os anos</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </Select>
          <Select label="Dificuldade" value={difficultyFilter} onChange={(value) => { setDifficultyFilter(value as typeof difficultyFilter); setPage(1); }}>
            <option value="all">Todas as dificuldades</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </Select>
          <Select label="Tipo de questão" value={typeFilter} onChange={(value) => { setTypeFilter(value as typeof typeFilter); setPage(1); }}>
            <option value="all">Todos os tipos</option>
            <option value="geral">Formação geral</option>
            <option value="especifico">Componente específico</option>
          </Select>
        </div>
        <div className="mt-3 text-right">
          <button type="button" onClick={clearFilters} className="text-sm font-semibold text-brand">Limpar filtros</button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          Todas as questões
          <span className="ml-2 rounded-full bg-[#f3f1ff] px-2 py-0.5 text-xs font-semibold text-brand">{filteredQuestions.length}</span>
        </h2>
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-10 rounded-xl border border-line bg-white px-3 text-sm">
          <option value="recentes">Mais recentes</option>
          <option value="antigas">Mais antigas</option>
          <option value="enunciado">Enunciado</option>
        </select>
      </div>

      {variant === 'teacher' && selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f3f1ff] px-4 py-3">
          <p className="text-sm font-medium">{selected.length} {selected.length === 1 ? 'questão selecionada' : 'questões selecionadas'}</p>
          <button type="button" onClick={() => onBuildExam?.(selected)} className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white">
            Montar prova com a seleção
          </button>
        </div>
      )}

      {variant === 'teacher' ? (
        <>
        <div className="space-y-3 xl:hidden">
          {pageItems.map((question) => (
            <article key={question.id} className="rounded-[24px] border border-line bg-white p-4">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.includes(question.id)} onChange={() => toggle(question.id)} aria-label={`Selecionar ${question.id}`} className="mt-1 shrink-0 accent-brand" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">#{question.id.replace('custom-', '').slice(0, 8)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${difficultyClass(question.difficulty)}`}>
                      {DIFFICULTY_LABEL[question.difficulty]}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-xs font-semibold text-brand">{question.area}</p>
                  <p className="mt-1 text-xs text-slate-400">ENADE {question.year} · {question.type === 'geral' ? 'Formação geral' : 'Múltipla escolha'}</p>
                  <p className="mt-2 line-clamp-3 break-words text-sm font-medium leading-relaxed">{question.text}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-1 border-t border-line pt-3">
                <IconButton label="Ver gabarito" onClick={() => setPreview(question)}><Eye className="h-4 w-4" /></IconButton>
                <IconButton label="Revisar e republicar" onClick={() => onEditQuestion?.(question)}><Pencil className="h-4 w-4" /></IconButton>
                <IconButton label="Apagar questão" onClick={() => { setDeleteError(''); setPendingDelete(question); }}><Trash2 className="h-4 w-4" /></IconButton>
              </div>
            </article>
          ))}
          {filteredQuestions.length === 0 && <Empty />}
          <div className="rounded-[24px] border border-line bg-white">
            <Pager
              page={safePage}
              pageCount={pageCount}
              total={filteredQuestions.length}
              from={filteredQuestions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
              to={Math.min(safePage * PAGE_SIZE, filteredQuestions.length)}
              onPage={setPage}
            />
          </div>
        </div>
        <div className="hidden overflow-hidden rounded-[24px] border border-line bg-white xl:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-canvas text-[11px] font-semibold tracking-wide text-slate-400">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={togglePage} aria-label="Selecionar página" className="accent-brand" />
                  </th>
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Enunciado</th>
                  <th className="px-3 py-3">Área / ano</th>
                  <th className="px-3 py-3">Dificuldade</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((question) => (
                  <tr key={question.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(question.id)} onChange={() => toggle(question.id)} aria-label={`Selecionar ${question.id}`} className="accent-brand" />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-500">#{question.id.replace('custom-', '').slice(0, 8)}</td>
                    <td className="max-w-md px-3 py-3">
                      <p className="line-clamp-1 font-semibold">{question.text}</p>
                      <p className="text-xs text-slate-400">{question.type === 'geral' ? 'Formação geral' : 'Múltipla escolha'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-xs font-semibold text-[#3d5afe]">{question.area}</span>
                      <p className="mt-1 text-xs text-slate-400">ENADE {question.year}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${difficultyClass(question.difficulty)}`}>
                        {DIFFICULTY_LABEL[question.difficulty]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label="Ver gabarito" onClick={() => setPreview(question)}><Eye className="h-4 w-4" /></IconButton>
                        <IconButton label="Revisar e republicar" onClick={() => onEditQuestion?.(question)}><Pencil className="h-4 w-4" /></IconButton>
                        <IconButton label="Apagar questão" onClick={() => { setDeleteError(''); setPendingDelete(question); }}><Trash2 className="h-4 w-4" /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredQuestions.length === 0 && <Empty />}
          <Pager
            page={safePage}
            pageCount={pageCount}
            total={filteredQuestions.length}
            from={filteredQuestions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
            to={Math.min(safePage * PAGE_SIZE, filteredQuestions.length)}
            onPage={setPage}
          />
        </div>
        </>
      ) : (
        <div className="space-y-3">
          {pageItems.map((question) => (
            <article key={question.id} className="rounded-[24px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f3f1ff] px-2.5 py-1 text-[11px] font-semibold text-brand">
                  {question.type === 'geral' ? 'Formação geral' : 'Componente específico'}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${difficultyClass(question.difficulty)}`}>
                  {DIFFICULTY_LABEL[question.difficulty]}
                </span>
                <span className="text-xs text-slate-400">ENADE {question.year}</span>
                <span className="ml-auto text-xs font-medium text-slate-500">{question.area}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm font-medium leading-relaxed">{question.text}</p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs text-slate-400">{question.comments.length} {question.comments.length === 1 ? 'comentário' : 'comentários'}</span>
                <button type="button" onClick={() => onExploreSingleQuestion?.(question)} className="h-9 rounded-xl bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-dark">
                  Resolver questão
                </button>
              </div>
            </article>
          ))}
          {filteredQuestions.length === 0 && <Empty />}
          <div className="rounded-[24px] border border-line bg-white">
            <Pager
              page={safePage}
              pageCount={pageCount}
              total={filteredQuestions.length}
              from={filteredQuestions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
              to={Math.min(safePage * PAGE_SIZE, filteredQuestions.length)}
              onPage={setPage}
            />
          </div>
        </div>
      )}

      {preview && (
        <Modal title="Gabarito comentado" onClose={() => setPreview(null)}>
          <p className="text-sm leading-relaxed text-slate-700">{preview.text}</p>
          <ol className="mt-4 space-y-2">
            {preview.alternatives.map((alternative, index) => {
              const correct = index === preview.correctAlternative;
              return (
                <li key={alternative} className={`rounded-xl border px-3 py-2 text-sm ${correct ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-950' : 'border-line'}`}>
                  {String.fromCharCode(65 + index)}. {alternative}
                  {correct && <span className="ml-2 text-[11px] uppercase text-emerald-700">Gabarito</span>}
                </li>
              );
            })}
          </ol>
          {preview.commentary && <p className="mt-4 text-sm leading-relaxed text-slate-600"><strong>Comentário. </strong>{preview.commentary}</p>}
          {preview.references && <p className="mt-2 text-xs text-slate-500"><strong>Referência. </strong>{preview.references}</p>}
        </Modal>
      )}

      {pendingDelete && (
        <Modal title="Apagar questão" onClose={() => { if (!deleting) setPendingDelete(null); }}>
          <p className="text-sm leading-relaxed text-slate-600">
            A questão sai do banco de dados. Essa exclusão vale para o professor e não pode ser desfeita.
          </p>
          {deleteError && <p className="mt-3 text-sm text-rose-600">{deleteError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={deleting} onClick={() => setPendingDelete(null)} className="h-10 rounded-xl border border-line px-4 text-sm font-semibold">Cancelar</button>
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                setDeleteError('');
                try {
                  await onDeleteQuestion?.(pendingDelete.id);
                  setSelected((current) => current.filter((id) => id !== pendingDelete.id));
                  setPendingDelete(null);
                } catch (err) {
                  setDeleteError(err instanceof Error ? err.message : 'Não foi possível apagar a questão.');
                } finally {
                  setDeleting(false);
                }
              }}
              className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {deleting ? 'Apagando...' : 'Apagar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">
        {children}
      </select>
    </label>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-canvas hover:text-ink">
      {children}
    </button>
  );
}

function Pager({ page, pageCount, total, from, to, onPage }: { page: number; pageCount: number; total: number; from: number; to: number; onPage: (page: number) => void }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-slate-500">
      <span className="min-w-0">Mostrando {from} a {to} de {total} questões</span>
      <div className="flex max-w-full flex-wrap items-center gap-1">
        <button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => onPage(page - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Anterior</span>
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => (
          <button key={number} type="button" onClick={() => onPage(number)} className={`h-9 w-9 rounded-lg text-sm font-semibold ${number === page ? 'bg-brand text-white' : 'hover:bg-canvas'}`}>
            {number}
          </button>
        ))}
        <button type="button" aria-label="Próxima página" disabled={page === pageCount} onClick={() => onPage(page + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 disabled:opacity-40">
          <span className="hidden sm:inline">Próximo</span> <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return <p className="px-4 py-12 text-center text-sm text-slate-500">Nenhuma questão corresponde a esses filtros.</p>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1 text-slate-500 hover:bg-canvas"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
