import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Question } from '../types';
import { MessageSquare, RefreshCw, Search, Send, Sparkles } from 'lucide-react';

interface ForumProps {
  questions: Question[];
  activeQuestion?: Question;
  authorName: string;
  authorRole: 'student' | 'teacher';
  onAddComment: (qId: string, author: string, role: 'student' | 'teacher', commentText: string, askAi: boolean) => Promise<void>;
  onMarkHelpful?: (questionId: string, commentId: string) => Promise<void>;
  viewerEmail?: string;
}

export default function Forum({ questions, activeQuestion, authorName, authorRole, onAddComment, onMarkHelpful, viewerEmail }: ForumProps) {
  const [selectedQId, setSelectedQId] = useState<string>(activeQuestion?.id || questions[0]?.id || '');
  const [query, setQuery] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [askAi, setAskAi] = useState(authorRole === 'student');
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  useEffect(() => {
    if (activeQuestion?.id) setSelectedQId(activeQuestion.id);
  }, [activeQuestion?.id]);

  useEffect(() => {
    setSelectedQId((current) => {
      if (current && questions.some((question) => question.id === current)) return current;
      return activeQuestion?.id || questions[0]?.id || '';
    });
  }, [questions, activeQuestion?.id]);

  const visibleQuestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter((question) =>
      question.text.toLowerCase().includes(term) || question.area.toLowerCase().includes(term)
    );
  }, [questions, query]);

  const selectedQuestion = questions.find((question) => question.id === selectedQId) || visibleQuestions[0];

  const handlePostComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCommentText.trim() || !selectedQuestion) return;
    setSubmitting(true);
    setPostError('');
    try {
      await onAddComment(selectedQuestion.id, authorName, authorRole, newCommentText, askAi && authorRole === 'student');
      setNewCommentText('');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Não foi possível publicar o comentário.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-12">
      <aside className="min-w-0 rounded-[24px] border border-line bg-white p-4 lg:col-span-4">
        <h2 className="text-xs font-bold tracking-wide text-brand">Fórum de dúvidas</h2>
        <p className="mt-1 text-sm text-slate-500">
          {authorRole === 'teacher'
            ? 'Escolha uma questão e responda aos estudantes.'
            : 'Esclareça suas dúvidas com colegas e professores. Use a mentoria de IA quando quiser.'}
        </p>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar tópicos ou dúvidas..."
            className="h-11 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="mt-3 max-h-[640px] space-y-2 overflow-y-auto pr-1">
          {visibleQuestions.map((question) => {
            const selected = question.id === selectedQuestion?.id;
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => setSelectedQId(question.id)}
                className={`w-full min-w-0 overflow-hidden rounded-2xl border p-3 text-left ${selected ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:bg-canvas'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`min-w-0 break-words text-[10px] font-bold tracking-wide ${selected ? 'text-white/80' : 'text-brand'}`}>
                    {question.area}
                  </span>
                  <span className={`inline-flex shrink-0 items-center gap-1 text-[11px] ${selected ? 'text-white/80' : 'text-slate-400'}`}>
                    <MessageSquare className="h-3 w-3" />
                    {question.comments.length}
                  </span>
                </div>
                <p className={`mt-2 line-clamp-2 break-words text-sm font-medium leading-snug ${selected ? 'text-white' : 'text-ink'}`}>
                  {question.text}
                </p>
              </button>
            );
          })}
          {visibleQuestions.length === 0 && (
            <p className="rounded-xl bg-canvas px-3 py-6 text-center text-sm text-slate-500">Nenhum tópico com esse termo.</p>
          )}
        </div>
      </aside>

      <section className="min-w-0 rounded-[24px] border border-line bg-white p-5 lg:col-span-8 md:p-6">
        {selectedQuestion ? (
          <div className="space-y-6">
            <header className="border-b border-line pb-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-[#f3f1ff] px-2.5 py-1 text-brand">
                  {selectedQuestion.type === 'geral' ? 'Formação geral' : 'Componente específico'}
                </span>
                <span className="text-slate-400">ENADE {selectedQuestion.year}</span>
                <span className="text-slate-400">{selectedQuestion.area}</span>
              </div>
              <h2 className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-brand md:text-2xl">
                {selectedQuestion.text.length > 140 ? `${selectedQuestion.text.slice(0, 140)}...` : selectedQuestion.text}
              </h2>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    UC
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Banco ENADE</p>
                    <p className="text-xs text-slate-400">Questão do banco · {selectedQuestion.comments.length} respostas</p>
                  </div>
                </div>
                {selectedQuestion.correctAlternative >= 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    Gabarito homologado: alternativa {String.fromCharCode(65 + selectedQuestion.correctAlternative)}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">{selectedQuestion.text}</p>
            </header>

            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-brand">
                <MessageSquare className="h-4 w-4" />
                Debates acadêmicos ({selectedQuestion.comments.length})
              </h3>
              {selectedQuestion.comments.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-canvas px-4 py-8 text-center text-sm text-slate-500">
                  Este espaço ainda está vazio. Publique a primeira dúvida.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {selectedQuestion.comments.map((comment, index) => {
                    const teacher = comment.role === 'teacher';
                    const ai = comment.role === 'ai';
                    return (
                      <article key={comment.id} className={`rounded-2xl border p-4 ${teacher ? 'border-emerald-100 bg-emerald-50/70' : ai ? 'border-violet-100 bg-[#f6f3ff]' : 'border-line bg-canvas'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${teacher ? 'bg-emerald-600' : ai ? 'bg-brand' : 'bg-slate-700'}`}>
                            {ai ? <Sparkles className="h-4 w-4" /> : comment.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">{comment.userName}</p>
                                <p className="text-xs text-slate-500">
                                  {teacher ? 'Corpo docente' : ai ? 'Tutor de IA' : 'Estudante'} · {comment.timestamp}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {teacher && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">Corpo docente</span>}
                                <span className="text-xs text-slate-400">#{index + 1}</span>
                              </div>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{comment.text}</p>
                            {teacher && (comment.helpfulBy?.length || 0) > 0 && (
                              <p className="mt-2 text-xs text-emerald-700">
                                {comment.helpfulBy?.length} {comment.helpfulBy?.length === 1 ? 'estudante marcou' : 'estudantes marcaram'} que a resposta ajudou
                              </p>
                            )}
                            {teacher && authorRole === 'student' && onMarkHelpful && viewerEmail && !comment.helpfulBy?.includes(viewerEmail) && (
                              <button
                                type="button"
                                className="mt-2 text-xs font-semibold text-brand"
                                onClick={() => { void onMarkHelpful(selectedQuestion.id, comment.id); }}
                              >
                                A resposta ajudou
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handlePostComment} className="space-y-4 border-t border-line pt-5">
              <h3 className="text-xs font-bold tracking-wide text-brand">Submeter novo comentário</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">Nome do autor</span>
                  <input readOnly value={authorName} className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">Atuação / papel</span>
                  <input
                    readOnly
                    value={authorRole === 'teacher' ? 'Professor (corpo docente)' : `Estudante de graduação (${authorName})`}
                    className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Seu comentário ou dúvida</span>
                <textarea
                  value={newCommentText}
                  onChange={(event) => setNewCommentText(event.target.value)}
                  rows={4}
                  required
                  placeholder={authorRole === 'teacher' ? 'Responda com a orientação do corpo docente...' : 'Seja cortês. Digite sua dúvida acadêmica detalhada...'}
                  className="w-full rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand"
                />
              </label>
              {authorRole === 'student' && (
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#2a1768] px-4 py-3 text-white">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Ativar mentoria de IA do canal</p>
                      <p className="text-xs text-white/70">Receba uma resposta calibrada com o gabarito da questão.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={askAi}
                    onClick={() => setAskAi((value) => !value)}
                    className={`relative h-6 w-11 rounded-full ${askAi ? 'bg-white' : 'bg-white/25'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-brand transition-all ${askAi ? 'left-5' : 'left-0.5 bg-white'}`} />
                  </button>
                </div>
              )}
              {postError && <p className="text-sm text-rose-600">{postError}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">Respeite as visões e evite linguagem ofensiva.</p>
                <button type="submit" disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Publicando...' : 'Publicar no fórum'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-slate-500">Nenhuma questão disponível para debate.</p>
        )}
      </section>
    </div>
  );
}
