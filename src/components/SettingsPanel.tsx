import { useState } from 'react';
import { SessionUser } from '../types';

interface SettingsPanelProps {
  user: SessionUser;
  onLogout: () => void;
}

const SETTINGS_KEY = 'unicolab_teacher_settings';

export default function SettingsPanel({ user, onLogout }: SettingsPanelProps) {
  const [notifyForum, setNotifyForum] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').notifyForum !== false;
    } catch {
      return true;
    }
  });
  const [message, setMessage] = useState('');

  const savePreferences = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ notifyForum }));
    setMessage('Preferências salvas neste navegador.');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="text-sm text-slate-400">Espaço do professor <span className="text-brand">/ Configurações</span></p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-slate-500">Dados da sessão docente e preferências guardadas neste dispositivo.</p>
      </header>

      <section className="rounded-[24px] border border-line bg-white p-5">
        <h2 className="font-bold">Perfil</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Info label="Nome" value={user.displayName} />
          <Info label="Usuário" value={user.username} />
          <Info label="Vínculo" value={user.course} />
          <Info label="Instituição" value="UniColab" />
        </dl>
      </section>

      <section className="rounded-[24px] border border-line bg-white p-5">
        <h2 className="font-bold">Notificações</h2>
        <label className="mt-4 flex items-center justify-between gap-4 text-sm">
          <span>
            <span className="block font-medium">Avisar dúvidas novas no painel</span>
            <span className="text-slate-500">Mantém o destaque das pendências do fórum.</span>
          </span>
          <input type="checkbox" checked={notifyForum} onChange={(event) => setNotifyForum(event.target.checked)} className="h-4 w-4 accent-brand" />
        </label>
        <button type="button" onClick={savePreferences} className="mt-4 h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white">
          Salvar preferências
        </button>
      </section>

      <section className="rounded-[24px] border border-line bg-white p-5">
        <h2 className="font-bold">Segurança</h2>
        <p className="mt-3 text-sm text-slate-500">A senha foi criada no primeiro acesso e fica neste navegador. Para trocá-la, saia e use “Esqueci minha senha”.</p>
      </section>

      {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}

      <section className="rounded-[24px] border border-line bg-white p-5">
        <h2 className="font-bold">Sessão</h2>
        <p className="mt-2 text-sm text-slate-500">Sair encerra o fluxo do professor neste navegador.</p>
        <button type="button" onClick={onLogout} className="mt-4 h-10 rounded-xl bg-rose-50 px-4 text-sm font-semibold text-rose-700">
          Sair da conta
        </button>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
