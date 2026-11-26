import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, UserRound, Sparkles, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { SessionUser } from '../types';
import { accountHasPassword, activateAccount, signIn } from '../api/unicolab';
import { findListed, LISTED_PEOPLE, ListedPerson } from '../demo/roster';

interface LoginProps {
  onLogin: (user: SessionUser, persist: boolean) => void;
}

type AuthMode = 'login' | 'register' | 'verify' | 'password' | 'forgot';
type LegalKind = 'privacidade' | 'termos' | 'ajuda' | null;

function passwordScore(password: string) {
  const rules = [
    { ok: password.length >= 12, label: '12+ caracteres' },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), label: 'Letras maiúsculas e minúsculas' },
    { ok: /\d/.test(password), label: 'Números' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Símbolos (@ # ! $)' },
  ];
  const score = rules.filter((rule) => rule.ok).length;
  const label = ['Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'][score];
  return { rules, score, label, complete: score === rules.length };
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [persist, setPersist] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [legal, setLegal] = useState<LegalKind>(null);
  const [email, setEmail] = useState('');
  const [person, setPerson] = useState<ListedPerson | null>(null);
  const [typedCode, setTypedCode] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const strength = useMemo(() => passwordScore(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const students = LISTED_PEOPLE.filter((item) => item.role === 'student');
  const teachers = LISTED_PEOPLE.filter((item) => item.role === 'teacher');
  const coordinators = LISTED_PEOPLE.filter((item) => item.role === 'coordinator');

  const openFirstAccess = () => {
    setMode('register');
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
  };

  const beginVerification = (found: ListedPerson) => {
    setPerson(found);
    setEmail(found.email);
    setTypedCode('');
    setMode('verify');
    setError('');
    setInfo('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    try {
      onLogin(await signIn(username.trim(), password, persist), persist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-mail ou senha não conferem.');
      setLoading(false);
    }
  };

  const handleEmail = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');
    const found = findListed(email);
    if (!found) {
      setError('Este e-mail não está na lista enviada pela universidade.');
      return;
    }
    if (mode === 'register' && accountHasPassword(found.email)) {
      setUsername(found.email);
      setMode('login');
      setInfo('Esta conta já tem senha. Entre com ela.');
      return;
    }
    beginVerification(found);
  };

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!person) return;
    const informed = typedCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(informed)) {
      setError('Digite o código de 6 caracteres enviado ao e-mail institucional.');
      return;
    }
    if (informed !== person.verificationCode) {
      setError('Código de verificação inválido.');
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setMode('password');
  };

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!person) return;
    if (!strength.complete) {
      setError('A senha precisa cumprir todos os critérios.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!acceptedTerms) {
      setError('Aceite os termos para criar a senha.');
      return;
    }
    setLoading(true);
    try {
      onLogin(await activateAccount(person.email, password, true), true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef0f6] p-3 sm:p-4 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1240px] lg:grid-cols-2 lg:gap-4">
        <aside className="relative hidden overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#24145f_0%,#3d2294_48%,#6846e4_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 left-10 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-extrabold ring-1 ring-white/25">
              U
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight">UniColab</span>
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-white/20">ENADE</span>
              </div>
              <p className="text-[11px] text-white/70">Plataforma de estudos</p>
            </div>
          </div>

          <div className="relative max-w-md space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma inteligente
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-5xl">
              {mode === 'login' || mode === 'forgot' ? (
                <>
                  Prepare-se para o<br />
                  <span className="text-[#c9d4ff]">ENADE</span>
                </>
              ) : person?.role === 'teacher' ? (
                <>
                  Crie sua senha e<br />
                  <span className="text-[#c9d4ff]">entre como professor</span>
                </>
              ) : person?.role === 'coordinator' ? (
                <>
                  Crie sua senha e<br />
                  <span className="text-[#c9d4ff]">abra o relatório do curso</span>
                </>
              ) : (
                <>
                  Crie sua senha e<br />
                  <span className="text-[#c9d4ff]">comece a treinar</span>
                </>
              )}
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/75">
              {person?.role === 'teacher'
                ? 'O acesso docente abre o banco de questões, as provas, o fórum e o painel do professor.'
                : person?.role === 'coordinator'
                  ? 'A coordenação vê o erro agregado da turma e a participação dos professores, sem a nota de cada estudante.'
                  : 'Banco de questões, simulados cronometrados, fórum de dúvidas e uma trilha que se adapta ao seu ritmo — tudo em um só lugar.'}
            </p>

            <div className="rounded-2xl bg-[#1b1148]/55 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between text-[11px] text-white/70">
                <span>Questão 12 · Engenharia de Software</span>
                <span>02:14</span>
              </div>
              <p className="text-sm font-semibold leading-snug">
                Qual padrão de projeto garante que uma classe tenha apenas uma instância?
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-xl bg-white/8 px-3 py-2 text-white/80 ring-1 ring-white/10">A &nbsp; Factory Method</div>
                <div className="flex items-center justify-between rounded-xl bg-emerald-400/15 px-3 py-2 text-emerald-100 ring-1 ring-emerald-300/40">
                  <span>B &nbsp; Singleton</span>
                  <Check className="h-4 w-4" />
                </div>
                <div className="rounded-xl bg-white/8 px-3 py-2 text-white/80 ring-1 ring-white/10">C &nbsp; Observer</div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
                <Sparkles className="h-3.5 w-3.5" />
                A IA explica por que a alternativa B está correta
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              ['200+', 'Questões'],
              ['50+', 'Simulados'],
              ['1.2k', 'Alunos ativos'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex flex-col px-4 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white">U</div>
              <span className="font-extrabold">UniColab</span>
            </div>
            <p className="ml-auto text-sm text-slate-500">
              {mode === 'login' ? (
                <>
                  Novo por aqui?{' '}
                  <button type="button" className="font-semibold text-brand" onClick={openFirstAccess}>
                    Primeiro acesso
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button type="button" className="font-semibold text-brand" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
            {mode === 'login' && (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight">Bem-vindo de volta</h2>
                <p className="mt-2 text-sm text-slate-500">Entre com o e-mail institucional e a senha que você criou.</p>
                <form onSubmit={handleLogin} className="mt-8 space-y-4" noValidate>
                  <Field label="E-mail institucional" icon={<Mail className="h-4 w-4" />}>
                    <input
                      id="unicolab-username"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => { setUsername(event.target.value); setError(''); setInfo(''); }}
                      placeholder="nome@edu.unifor.br"
                      className="h-12 w-full bg-transparent text-sm outline-none"
                      required
                    />
                  </Field>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="unicolab-password" className="text-sm font-medium text-slate-700">Senha</label>
                      <button type="button" className="text-sm font-medium text-brand" onClick={() => { setMode('forgot'); setEmail(username); setError(''); setInfo(''); }}>
                        Esqueci minha senha
                      </button>
                    </div>
                    <Field icon={<Lock className="h-4 w-4" />} trailing={
                      <button type="button" className="text-slate-400" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }>
                      <input
                        id="unicolab-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => { setPassword(event.target.value); setError(''); }}
                        className="h-12 w-full bg-transparent text-sm outline-none"
                        required
                      />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={persist} onChange={(event) => setPersist(event.target.checked)} className="h-4 w-4 accent-brand" />
                    Manter conectado neste dispositivo
                  </label>
                  {error && <Alert text={error} />}
                  {info && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>}
                  <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-[0_8px_20px_rgba(109,74,255,0.28)] hover:bg-brand-dark disabled:opacity-60">
                    {loading ? 'Entrando...' : 'Entrar na plataforma'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              </>
            )}

            {(mode === 'register' || mode === 'forgot') && (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight">{mode === 'forgot' ? 'Recuperar acesso' : 'Primeiro acesso'}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === 'forgot'
                    ? 'Informe o e-mail da lista. A próxima tela pede o código de verificação enviado a esse e-mail institucional.'
                    : 'Use o e-mail institucional que a universidade enviou. Aluno, professor e coordenação entram por aqui.'}
                </p>
                <form onSubmit={handleEmail} className="mt-7 space-y-4" noValidate>
                  <Labeled label="E-mail institucional">
                    <Field icon={<Mail className="h-4 w-4" />}>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="nome@edu.unifor.br"
                        className="h-12 w-full bg-transparent text-sm outline-none"
                      />
                    </Field>
                  </Labeled>
                  {error && <Alert text={error} />}
                  <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark">
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
                <Directory students={students} teachers={teachers} coordinators={coordinators} onPick={(value) => { setEmail(value); setError(''); }} />
              </>
            )}

            {mode === 'verify' && person && (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight">Verificar e-mail</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Enviamos um código de verificação para {person.email}. Digite o código recebido nesse e-mail institucional para continuar.
                </p>
                <form onSubmit={handleVerify} className="mt-7 space-y-4" noValidate>
                  <Labeled label="Código de verificação">
                    <Field icon={<UserRound className="h-4 w-4" />}>
                      <input
                        value={typedCode}
                        onChange={(event) => {
                          setTypedCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                          setError('');
                        }}
                        placeholder="6 caracteres"
                        maxLength={6}
                        inputMode="text"
                        autoComplete="one-time-code"
                        className="h-12 w-full bg-transparent text-sm uppercase outline-none tracking-widest"
                        required
                      />
                    </Field>
                  </Labeled>
                  <p className="text-xs leading-relaxed text-slate-500">
                    O código tem 6 caracteres e foi enviado para {person.email}. Ele não aparece nesta tela.
                  </p>
                  {error && <Alert text={error} />}
                  <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark">
                    Confirmar e continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}

            {mode === 'password' && person && (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight">Criar senha</h2>
                <p className="mt-2 text-sm text-slate-500">A conta já está reservada. Escolha a senha deste e-mail.</p>
                <div className="mt-5 rounded-xl border border-line bg-white px-3 py-3 text-sm">
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-slate-500">{person.course}</p>
                  {person.specialty && <p className="text-slate-500">{person.specialty}</p>}
                  <p className="mt-1 break-all text-slate-400">{person.email}</p>
                </div>
                <form onSubmit={handlePassword} className="mt-4 space-y-4" noValidate>
                  <Labeled label="Senha">
                    <Field icon={<Lock className="h-4 w-4" />} trailing={
                      <button type="button" className="text-slate-400" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none" autoComplete="new-password" />
                    </Field>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((index) => (
                        <span key={index} className={`h-1.5 rounded-full ${index < strength.score ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Força da senha</span>
                      <span className={strength.complete ? 'font-semibold text-emerald-600' : 'text-slate-500'}>{password ? strength.label : ''}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs">
                      {strength.rules.map((rule) => (
                        <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {rule.ok ? <Check className="h-3.5 w-3.5" /> : <span className="inline-block h-3.5 w-3.5 rounded-full border border-slate-300" />}
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  </Labeled>
                  <Labeled label="Confirmar senha">
                    <Field icon={<Lock className="h-4 w-4" />} trailing={passwordsMatch ? <Check className="h-4 w-4 text-emerald-500" /> : null}>
                      <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none" autoComplete="new-password" />
                    </Field>
                    {passwordsMatch && <p className="mt-1 text-xs text-emerald-600">As senhas coincidem</p>}
                  </Labeled>
                  <label className="flex items-start gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
                    <span>
                      Li e aceito os{' '}
                      <button type="button" className="font-semibold text-brand" onClick={() => setLegal('termos')}>Termos de uso</button>
                      {' '}e a{' '}
                      <button type="button" className="font-semibold text-brand" onClick={() => setLegal('privacidade')}>Política de privacidade</button>
                      {' '}da UniColab.
                    </span>
                  </label>
                  {error && <Alert text={error} />}
                  <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                    {loading ? 'Entrando...' : 'Criar senha e entrar'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              </>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 pb-2 text-xs text-slate-400">
            <span>© 2026 UniColab</span>
            <div className="flex gap-4">
              <button type="button" onClick={() => setLegal('privacidade')}>Privacidade</button>
              <button type="button" onClick={() => setLegal('termos')}>Termos</button>
              <button type="button" onClick={() => setLegal('ajuda')}>Ajuda</button>
            </div>
          </footer>
        </section>
      </div>

      {legal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center" onClick={() => setLegal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="text-lg font-extrabold">
              {legal === 'privacidade' && 'Privacidade'}
              {legal === 'termos' && 'Termos de uso'}
              {legal === 'ajuda' && 'Ajuda'}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {legal === 'privacidade' && 'O primeiro acesso usa o e-mail da lista da universidade. A senha fica apenas neste navegador, nesta demonstração.'}
              {legal === 'termos' && 'A UniColab é um protótipo acadêmico para estudo do ENADE. O conteúdo serve para treino e não substitui o exame oficial.'}
              {legal === 'ajuda' && 'Escolha um e-mail da lista sem senha, digite o código de verificação enviado a esse e-mail institucional e crie a senha. O aluno entra no fluxo do aluno, o professor no espaço do professor e a coordenação no relatório do curso.'}
            </p>
            <button type="button" className="mt-5 h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white" onClick={() => setLegal(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Directory({
  students,
  teachers,
  coordinators,
  onPick,
}: {
  students: ListedPerson[];
  teachers: ListedPerson[];
  coordinators: ListedPerson[];
  onPick: (email: string) => void;
}) {
  return (
    <div className="mt-6 space-y-3 text-xs text-slate-500">
      <Group title="Alunos" people={students} onPick={onPick} />
      <Group title="Professores" people={teachers} onPick={onPick} />
      <Group title="Coordenação" people={coordinators} onPick={onPick} />
    </div>
  );
}

function Group({ title, people, onPick }: { title: string; people: ListedPerson[]; onPick: (email: string) => void }) {
  return (
    <div>
      <p className="font-semibold text-slate-700">{title}</p>
      <ul className="mt-1 space-y-1">
        {people.map((person) => (
          <li key={person.email}>
            <button type="button" className="break-all text-left text-brand" onClick={() => onPick(person.email)}>
              {person.email}
            </button>
            <span className="text-slate-400"> · {person.course}{person.specialty ? ` · ${person.specialty}` : ''} · {accountHasPassword(person.email) ? 'senha já criada' : 'sem senha'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Field({
  label,
  icon,
  trailing,
  children,
}: {
  label?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
        {icon && <span className="text-slate-400">{icon}</span>}
        {children}
        {trailing}
      </div>
    </div>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {text}
    </p>
  );
}
