import { useState, type ReactNode } from 'react';
import { SessionUser, SimulationHistoryItem } from '../types';
import {
  Bell,
  BookOpen,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

type StudentTab = 'dashboard' | 'banco' | 'forum' | 'trilha';
type TeacherTab = 'painel' | 'banco' | 'provas' | 'forum' | 'config' | 'professor';

const STUDENT_ITEMS: Array<{ id: StudentTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'banco', label: 'Banco de questões', icon: BookOpen },
  { id: 'forum', label: 'Fórum de dúvidas', icon: MessageSquare },
  { id: 'trilha', label: 'Trilha IA', icon: Sparkles },
];

const TEACHER_ITEMS: Array<{ id: Exclude<TeacherTab, 'professor'>; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'painel', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'banco', label: 'Banco de questões', icon: BookOpen },
  { id: 'provas', label: 'Provas e listas', icon: ClipboardList },
  { id: 'forum', label: 'Fórum de dúvidas', icon: MessageSquare },
  { id: 'config', label: 'Configurações', icon: Settings },
];

export function StudentShell({
  user,
  points,
  activeTab,
  history,
  onNavigate,
  onLogout,
  simActive,
  onDiscardSim,
  children,
}: {
  user: SessionUser;
  points: number;
  activeTab: StudentTab;
  history: SimulationHistoryItem[];
  onNavigate: (tab: StudentTab) => void;
  onLogout: () => void;
  simActive: boolean;
  onDiscardSim: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const initials = user.displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Brand />
          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-canvas p-1 lg:flex">
            {STUDENT_ITEMS.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id && !simActive;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${selected ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 sm:inline-flex">
              <Trophy className="h-3.5 w-3.5" />
              {points.toLocaleString('pt-BR')} XP
            </span>
            <div className="relative">
              <button type="button" aria-label="Avisos" onClick={() => setBell((value) => !value)} className="relative rounded-full p-2 text-slate-500 hover:bg-canvas">
                <Bell className="h-4 w-4" />
                {history.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />}
              </button>
              {bell && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-line bg-white p-3 text-sm shadow-lg">
                  <p className="font-semibold">Atividade recente</p>
                  {history.slice(0, 3).map((item) => (
                    <p key={item.id} className="mt-2 text-slate-600">{item.date}: {item.scorePercent}%{item.title ? ` · ${item.title}` : ` em ${item.totalQuestions} questões`}</p>
                  ))}
                  {history.length === 0 && <p className="mt-2 text-slate-500">Nenhum simulado ainda.</p>}
                </div>
              )}
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{initials}</div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{user.displayName}</p>
                <p className="text-[11px] text-slate-400">{user.course}</p>
              </div>
            </div>
            <button type="button" onClick={onLogout} aria-label="Sair" className="hidden rounded-full p-2 text-slate-500 hover:bg-canvas sm:inline-flex">
              <LogOut className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-2 lg:hidden" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((value) => !value)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="space-y-1 border-t border-line px-4 py-3 lg:hidden">
            {STUDENT_ITEMS.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id && !simActive;
              return (
                <button key={item.id} type="button" onClick={() => { onNavigate(item.id); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${selected ? 'bg-brand text-white' : 'text-slate-600'}`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
            <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </header>

      {simActive && (
        <div className="bg-[#2a1768] px-4 py-2 text-xs font-medium text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <span>Simulado em andamento. O resultado só entra no histórico ao finalizar.</span>
            <button type="button" onClick={onDiscardSim} className="rounded-lg bg-white/10 px-2 py-1">Sair e descartar</button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function TeacherShell({
  user,
  activeTab,
  onNavigate,
  onLogout,
  children,
}: {
  user: SessionUser;
  activeTab: TeacherTab;
  onNavigate: (tab: TeacherTab) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const current = activeTab === 'professor' ? 'banco' : activeTab;
  const initials = user.displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  const nav = (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5">
        <Brand />
        <p className="mt-6 px-2 text-[11px] font-semibold tracking-wide text-slate-400">Espaço do professor</p>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {TEACHER_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = current === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { onNavigate(item.id); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${selected ? 'bg-[#eef0ff] text-brand' : 'text-slate-600 hover:bg-canvas'}`}
            >
              <span className={`h-5 w-0.5 rounded-full ${selected ? 'bg-brand' : 'bg-transparent'}`} />
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="space-y-3 p-4">
        <button type="button" onClick={() => { onNavigate('forum'); setOpen(false); }} className="w-full rounded-2xl bg-canvas p-3 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold"><HelpCircle className="h-4 w-4 text-brand" /> Precisa de ajuda?</p>
          <p className="mt-1 text-xs text-slate-500">Veja as dúvidas abertas no fórum da turma.</p>
          <span className="mt-2 inline-block text-xs font-semibold text-brand">Abrir fórum</span>
        </button>
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef0ff] text-xs font-bold text-brand">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="text-xs text-slate-400">Professor</p>
          </div>
          <button type="button" onClick={onLogout} aria-label="Sair" className="rounded-lg p-2 text-slate-400 hover:bg-canvas hover:text-rose-600">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-white lg:block">{nav}</aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
          <Brand />
          <button type="button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((value) => !value)} className="rounded-lg p-2">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && <div className="border-b border-line bg-white lg:hidden">{nav}</div>}
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
        <SiteFooter compact />
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white">U</div>
      <div className="leading-tight">
        <p className="text-sm font-extrabold">UniColab</p>
        <p className="text-[10px] text-slate-400">Plataforma de estudos</p>
      </div>
    </div>
  );
}

function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="mt-8 bg-[#1a1033] px-4 py-8 text-xs text-white/70">
      <div className={`mx-auto flex w-full flex-col gap-4 md:flex-row md:justify-between ${compact ? 'max-w-6xl' : 'max-w-6xl'}`}>
        <div>
          <p className="font-semibold text-white">UniColab — Plataforma de Estudos Baseada em Engenharia de Requisitos</p>
          <p className="mt-1 max-w-xl">
            Desenvolvedores: Francisco R. F. Araújo Jr. · Lucas S. Bandeira · Pedro M. C. Costa · Vinicius G. C. Barbosa · José M. L. M. Barroso · Carlos L. C. Rocha
          </p>
        </div>
      </div>
    </footer>
  );
}
