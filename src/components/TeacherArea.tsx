import { useEffect, useState } from 'react';
import { Question } from '../types';
import { AlertCircle, CheckCircle, FilePlus2, ImagePlus, Info, Lock, Save, ShieldCheck, Sigma } from 'lucide-react';

interface TeacherAreaProps {
  onAddQuestion: (newQuestionData: {
    text: string;
    type: 'geral' | 'especifico';
    area: string;
    year: number;
    difficulty: 'facil' | 'medio' | 'dificil';
    alternatives: string[];
    correctAlternative: number;
    justifications: string[];
    references: string;
  }) => Promise<void>;
  existingQuestions: Question[];
  initialQuestion?: Question | null;
  areas?: string[];
}

const AREAS = [
  'Padrões de Projeto & Engenharia de Software',
  'Arquitetura de Sistemas Distributed',
  'Responsabilidade Social & ESG',
  'Tecnologia & Ética na Sociedade',
  'Algoritmos & Estruturas de Dados',
  'Engenharia de Bancos de Dados Relacionais',
  'Inteligência Artificial & Ciência de Dados',
  'Infraestrutura & Redes de Computadores',
];

const DRAFT_KEY = 'unicolab_question_draft';
const STEPS = ['Contexto', 'Alternativas', 'Gabarito e referências'];

interface Draft {
  text: string;
  type: 'geral' | 'especifico';
  area: string;
  year: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  alternatives: string[];
  correctIdx: number;
  justifications: string[];
  references: string;
}

function five(values: string[] | undefined) {
  const next = [...(values ?? [])];
  while (next.length < 5) next.push('');
  return next.slice(0, 5);
}

function emptyDraft(): Draft {
  return {
    text: '',
    type: 'especifico',
    area: AREAS[0],
    year: '2024',
    difficulty: 'medio',
    alternatives: ['', '', '', '', ''],
    correctIdx: 0,
    justifications: ['', '', '', '', ''],
    references: '',
  };
}

function fromQuestion(question: Question): Draft {
  const justifications = five(question.justifications);
  if (justifications.every((item) => !item.trim()) && question.commentary && question.correctAlternative >= 0) {
    justifications[question.correctAlternative] = question.commentary;
  }
  return {
    text: question.text,
    type: question.type,
    area: question.area,
    year: String(question.year),
    difficulty: question.difficulty,
    alternatives: five(question.alternatives),
    correctIdx: question.correctAlternative >= 0 ? question.correctAlternative : 0,
    justifications,
    references: question.references,
  };
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft> & { commentary?: string };
    const draft = { ...emptyDraft(), ...parsed, alternatives: five(parsed.alternatives), justifications: five(parsed.justifications) };
    if (draft.justifications.every((item) => !item.trim()) && parsed.commentary) {
      draft.justifications[draft.correctIdx] = parsed.commentary;
    }
    return draft;
  } catch {
    return null;
  }
}

export default function TeacherArea({ onAddQuestion, existingQuestions, initialQuestion, areas = AREAS }: TeacherAreaProps) {
  const [draft, setDraft] = useState<Draft>(() => initialQuestion ? fromQuestion(initialQuestion) : loadDraft() || emptyDraft());
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [startedWith] = useState(() => new Set(existingQuestions.map((question) => question.id)));
  const sessionQuestions = existingQuestions.filter((question) => !startedWith.has(question.id));

  useEffect(() => {
    setDraft(initialQuestion ? fromQuestion(initialQuestion) : loadDraft() || emptyDraft());
    setStep(0);
    setStatusMessage(null);
  }, [initialQuestion]);

  useEffect(() => {
    if (areas.length === 0) return;
    setDraft((current) => areas.includes(current.area) ? current : { ...current, area: areas[0] });
  }, [areas]);

  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftNote('Rascunho salvo neste dispositivo.');
  };

  const appendToText = (snippet: string) => {
    patch({ text: `${draft.text}${draft.text ? '\n' : ''}${snippet}`.slice(0, 4000) });
  };

  const goNext = () => {
    if (step === 0 && draft.text.trim().length < 20) {
      setStatusMessage({ type: 'error', text: 'Escreva um enunciado com pelo menos 20 caracteres.' });
      return;
    }
    if (step === 1 && draft.alternatives.some((item) => !item.trim())) {
      setStatusMessage({ type: 'error', text: 'Preencha as cinco alternativas.' });
      return;
    }
    setStatusMessage(null);
    setStep((current) => Math.min(2, current + 1));
  };

  const handleSubmit = async () => {
    if (draft.alternatives.some((item) => !item.trim()) || draft.text.trim().length < 20) {
      setStatusMessage({ type: 'error', text: 'Revise o enunciado e as cinco alternativas antes de publicar.' });
      setStep(draft.text.trim().length < 20 ? 0 : 1);
      return;
    }
    const missing = draft.justifications
      .map((item, index) => (item.trim().length >= 10 ? '' : String.fromCharCode(65 + index)))
      .filter(Boolean);
    if (missing.length > 0) {
      setStatusMessage({ type: 'error', text: `Escreva a justificativa das alternativas ${missing.join(', ')} com pelo menos 10 caracteres.` });
      return;
    }
    setSubmitting(true);
    setStatusMessage(null);
    try {
      await onAddQuestion({
        text: draft.text.trim(),
        type: draft.type,
        area: draft.area,
        year: parseInt(draft.year, 10) || 2024,
        difficulty: draft.difficulty,
        alternatives: draft.alternatives.map((item) => item.trim()),
        correctAlternative: draft.correctIdx,
        justifications: draft.justifications.map((item) => item.trim()),
        references: draft.references.trim(),
      });
      setStatusMessage({
        type: 'success',
        text: initialQuestion
          ? 'Uma nova versão foi publicada no banco. A questão original permanece.'
          : 'Questão cadastrada. Ela já entra no banco e nos simulados.',
      });
      if (!initialQuestion) {
        setDraft(emptyDraft());
        localStorage.removeItem(DRAFT_KEY);
        setStep(0);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Não foi possível cadastrar a questão.' });
    } finally {
      setSubmitting(false);
    }
  };

  const addedCount = sessionQuestions.length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Banco de questões <span className="text-brand">/ {initialQuestion ? 'Revisar questão' : 'Nova questão ENADE'}</span></p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Cadastrar nova questão ENADE</h1>
          <p className="mt-1 text-sm text-slate-500">Estruture a questão por etapas para garantir clareza, consistência e qualidade pedagógica.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-line">
          <Info className="h-3.5 w-3.5" />
          Rascunho em edição
        </span>
      </header>

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-12">
        <aside className="min-w-0 space-y-4 lg:col-span-4">
          <div className="rounded-[24px] bg-[linear-gradient(180deg,#2a1768,#4a2cb8)] p-5 text-white">
            <p className="text-[11px] font-semibold tracking-wide text-white/70">Curadoria UniColab</p>
            <h2 className="mt-1 text-xl font-extrabold">Portal do docente</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Para apoiar a curadoria pedagógica da UniColab, crie enunciados completos, contextualizados e alinhados às competências avaliadas pelo ENADE.
            </p>
            <p className="mt-4 flex gap-2 text-sm text-white/85">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Forneça um gabarito consolidado, com justificativa e as devidas referências bibliográficas.
            </p>
            <p className="mt-4 rounded-2xl bg-white/10 p-3 text-sm text-white/85">
              Use situações-problema reais e evite pistas na redação das alternativas.
            </p>
          </div>

          <div className="rounded-[24px] border border-line bg-white p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Nesta sessão</span>
              <span className="text-slate-400">{addedCount} {addedCount === 1 ? 'questão' : 'questões'}</span>
            </div>
            {addedCount === 0 ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f1ff] text-brand">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold">Nenhuma questão inserida</p>
                <p className="mt-1 text-sm text-slate-500">Preencha o formulário ao lado para adicionar a primeira questão desta sessão.</p>
              </div>
            ) : (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {sessionQuestions.map((question) => (
                  <li key={question.id} className="rounded-xl bg-canvas px-3 py-2 text-sm">
                    <p className="line-clamp-2 font-medium">{question.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[24px] border border-line bg-white p-4 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Rascunho automático
            </p>
            <p className="mt-1 text-slate-500">O botão Salvar rascunho guarda o formulário neste navegador.</p>
            {draftNote && <p className="mt-2 text-emerald-700">{draftNote}</p>}
          </div>
        </aside>

        <section className="min-w-0 rounded-[24px] border border-line bg-white p-5 md:p-6 lg:col-span-8">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {STEPS.map((label, index) => (
              <li key={label} className="flex min-w-0 items-center gap-2">
                <button type="button" onClick={() => index < step && setStep(index)} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === step ? 'bg-brand text-white' : index < step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {index + 1}
                </button>
                <span className={`truncate ${index === step ? 'font-semibold' : 'text-slate-400'}`}>{label}</span>
                {index < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-line sm:block" />}
              </li>
            ))}
          </ol>

          {statusMessage && (
            <p className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
              {statusMessage.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              {statusMessage.text}
            </p>
          )}

          {step === 0 && (
            <div className="mt-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold">Identificação e enquadramento</h2>
                <p className="text-sm text-slate-500">Selecione os dados acadêmicos usados para organizar a questão no banco.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">Componente</span>
                  <select value={draft.type} onChange={(event) => patch({ type: event.target.value as Draft['type'] })} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line px-3">
                    <option value="especifico">Formação específica</option>
                    <option value="geral">Formação geral</option>
                  </select>
                </label>
                <label className="text-sm md:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">Área temática</span>
                  <select value={draft.area} onChange={(event) => patch({ area: event.target.value })} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line px-3">
                    {(areas.length > 0 ? areas : AREAS).map((area) => <option key={area}>{area}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">Ano do ENADE</span>
                  <input value={draft.year} onChange={(event) => patch({ year: event.target.value })} className="h-11 w-full rounded-xl border border-line px-3" />
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">Nível de dificuldade</span>
                  <select value={draft.difficulty} onChange={(event) => patch({ difficulty: event.target.value as Draft['difficulty'] })} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line px-3">
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
                  Enunciado principal
                  <span>Obrigatório</span>
                </span>
                <textarea
                  value={draft.text}
                  maxLength={4000}
                  rows={7}
                  onChange={(event) => patch({ text: event.target.value })}
                  placeholder="Apresente uma situação-problema contextualizada, com todos os dados necessários para o estudante analisar o cenário."
                  className="w-full rounded-2xl border border-line px-3 py-3 text-sm outline-none focus:border-brand"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-brand">
                    <ImagePlus className="h-4 w-4" />
                    Inserir imagem
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) appendToText(`[Imagem: ${file.name}]`);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <button type="button" onClick={() => appendToText('[Fórmula: ]')} className="inline-flex items-center gap-1.5 font-semibold text-brand">
                    <Sigma className="h-4 w-4" />
                    Inserir fórmula
                  </button>
                </div>
                <span className="text-xs text-slate-400">{draft.text.length} / 4.000 caracteres</span>
              </div>
              <p className="text-xs text-slate-400">Inclua fontes, tabelas ou imagens apenas quando forem essenciais para a resolução. O arquivo de imagem entra como referência no texto.</p>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 space-y-3">
              <h2 className="text-lg font-bold">Alternativas de resposta</h2>
              <p className="text-sm text-slate-500">Escreva cinco alternativas. A correta é marcada na etapa seguinte.</p>
              {draft.alternatives.map((alternative, index) => (
                <label key={index} className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-sm font-bold">{String.fromCharCode(65 + index)}</span>
                  <input
                    value={alternative}
                    onChange={(event) => {
                      const alternatives = [...draft.alternatives];
                      alternatives[index] = event.target.value;
                      patch({ alternatives });
                    }}
                    placeholder={`Conteúdo da alternativa ${String.fromCharCode(65 + index)}`}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-line px-3 text-sm"
                  />
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-bold">Gabarito e referências</h2>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Alternativa correta</p>
                <div className="flex gap-2">
                  {draft.alternatives.map((_, index) => {
                    const letter = String.fromCharCode(65 + index);
                    const saved = draft.justifications[index]?.trim().length > 0;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => patch({ correctIdx: index })}
                        aria-label={`Alternativa ${letter}`}
                        className={`h-10 w-10 rounded-xl text-sm font-bold ${draft.correctIdx === index ? 'bg-brand text-white' : saved ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-canvas text-slate-600'}`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-sm text-slate-600">{draft.alternatives[draft.correctIdx] || 'A alternativa escolhida ainda está vazia.'}</p>
                <p className="mt-1 text-xs text-slate-400">A letra marcada é a correta. Cada letra guarda a própria justificativa.</p>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Justificativa da alternativa {String.fromCharCode(65 + draft.correctIdx)}</span>
                <textarea
                  key={draft.correctIdx}
                  value={draft.justifications[draft.correctIdx] || ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft((current) => {
                      const justifications = five(current.justifications);
                      justifications[current.correctIdx] = value;
                      return { ...current, justifications };
                    });
                  }}
                  rows={4}
                  className="w-full rounded-xl border border-line px-3 py-3 text-sm"
                  placeholder="Explique esta alternativa. Ao trocar a letra, este texto fica salvo e o campo da próxima abre em branco."
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Referência bibliográfica</span>
                <textarea value={draft.references} onChange={(event) => patch({ references: event.target.value })} rows={3} className="w-full rounded-xl border border-line px-3 py-3 text-sm" placeholder="Autor, obra, editora e ano." />
              </label>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" />
              Conteúdo visível para a curadoria até a publicação.
            </p>
            <div className="flex gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep((current) => current - 1)} className="h-11 rounded-xl border border-line px-4 text-sm font-semibold">
                  Voltar
                </button>
              )}
              <button type="button" onClick={saveDraft} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold">
                <Save className="h-4 w-4" />
                Salvar rascunho
              </button>
              {step < 2 ? (
                <button type="button" onClick={goNext} className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
                  {step === 0 ? 'Continuar para alternativas' : 'Continuar para o gabarito'}
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting} className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                  {submitting ? 'Publicando...' : 'Publicar questão'}
                </button>
              )}
            </div>
          </div>
          </section>
      </div>
    </div>
  );
}
