import { useEffect, useState } from 'react';
import { Clock, Play } from 'lucide-react';

const SIZES = [10, 15, 20];

interface PersonalSimuladoProps {
  eligible: number;
  ready: boolean;
  creating: boolean;
  onStart: (quantidade: number) => void;
}

export default function PersonalSimulado({ eligible, ready, creating, onStart }: PersonalSimuladoProps) {
  const options = SIZES.filter((size) => size <= eligible);
  const [size, setSize] = useState(options[0] ?? 10);

  useEffect(() => {
    const available = SIZES.filter((item) => item <= eligible);
    setSize((current) => (available.includes(current) ? current : available[0] ?? current));
  }, [eligible]);

  return (
    <section className="rounded-[24px] border border-line bg-white p-4 md:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="h-4 w-4 text-brand" />
        Simulado com mais questões
      </div>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
        Monte um simulado seu, maior do que a prática de uma questão. Entram somente questões publicadas que já possuem justificativa em todas as alternativas.
      </p>
      {!ready ? (
        <p className="mt-4 text-sm text-slate-500">Carregando as questões com justificativa.</p>
      ) : options.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {eligible === 0
            ? 'Ainda não há questões publicadas com justificativa para montar esse simulado.'
            : `Há ${eligible} questões com justificativa. É preciso de pelo menos 10 para esta opção.`}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              className={`h-10 rounded-xl px-3 text-sm font-semibold ${option === size ? 'bg-brand text-white' : 'bg-canvas text-slate-600'}`}
            >
              {option} questões
            </button>
          ))}
          <button
            type="button"
            onClick={() => onStart(size)}
            disabled={creating}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            <Play className="h-4 w-4 fill-current" />
            {creating ? 'Montando simulado...' : `Começar simulado de ${size} questões`}
          </button>
        </div>
      )}
    </section>
  );
}
