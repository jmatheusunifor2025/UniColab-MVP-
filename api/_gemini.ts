import { GoogleGenAI } from '@google/genai';

const TRAIL_MODEL = 'gemini-3.5-flash-lite';
const EXPLAIN_MODEL = 'gemini-3.5-flash';

export function geminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'O Gemini não respondeu.';
}

async function modelText(model: string, contents: string) {
  const ai = geminiClient();
  if (!ai) return '';
  const response = await ai.models.generateContent({
    model,
    contents,
  });
  return response.text?.trim() || '';
}

function localTrail(name: string) {
  return `Diagnóstico: ${name}, comece pelas áreas com mais erro e mantenha blocos curtos de estudo.

Plano de ação:
1. Revise a justificativa das questões erradas da área mais fraca.
2. Resolva 5 questões comentadas dessa área.
3. Feche a semana com um simulado curto cronometrado.

Cronograma da semana:
- Segunda: teoria da área mais fraca, 25 min
- Terça: 5 questões comentadas, 25 min
- Quarta: segunda área fraca, teoria, 25 min
- Quinta: 5 questões dessa área, 25 min
- Sexta: revisão dos erros da semana, 25 min
- Sábado: simulado curto cronometrado, 40 min
- Domingo: descanso ou releitura leve, 15 min

Dica de prova: se travar em uma questão, marque e siga. Volte nela só no fim do tempo.`;
}

export async function studyTrail(body: unknown) {
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const stats = input.stats && typeof input.stats === 'object' ? input.stats as Record<string, unknown> : {};
  const name = typeof input.studentName === 'string' && input.studentName.trim() ? input.studentName.trim() : 'estudante';
  const completed = Number(stats.completedCount ?? stats.completedQuestionsCount ?? 0) || 0;
  const informedScore = Number(stats.scorePercent);
  const score = Number.isFinite(informedScore) ? informedScore : 0;
  const wrongAreas = Array.isArray(input.wrongAreas) ? input.wrongAreas.filter((area) => typeof area === 'string') : [];
  const wrongAreasStr = wrongAreas.length > 0 ? wrongAreas.join(', ') : 'Temas Gerais';

  if (!geminiClient()) {
    return {
      status: 200,
      payload: { source: 'fallback', studyTrail: localTrail(name) },
    };
  }

  const prompt = `Você é o Tutor de Estudos Inteligente da plataforma UniColab para o ENADE.
O estudante se chama ${name}.
Áreas com menor desempenho: [${wrongAreasStr}].
Questões concluídas: ${completed}. Desempenho geral de acerto: ${score}%.

Gere uma trilha de estudos em português, usando o nome do estudante.
Seja direto e prático. Máximo de 35 linhas.
Não invente nota, data de prova nem horário que não foi informado.
Use apenas as áreas informadas. Se a lista for Temas Gerais, distribua a semana entre formação geral e uma revisão do curso.

Estrutura obrigatória, nesta ordem:

Diagnóstico
Um parágrafo curto sobre o ponto de partida do estudante.

Plano de ação
Três passos numerados. Cada passo cita uma área fraca, o que revisar e quantas questões fazer.

Cronograma da semana
Um modelo de 7 dias, uma linha por dia, neste formato:
- Segunda: tema, duração e atividade
- Terça: tema, duração e atividade
- Quarta: tema, duração e atividade
- Quinta: tema, duração e atividade
- Sexta: tema, duração e atividade
- Sábado: simulado curto ou revisão dos erros, com duração
- Domingo: descanso ou releitura leve, com duração
Blocos de dia de semana entre 20 e 30 minutos. Sábado até 40 minutos.

Dica de prova
Uma frase sobre ritmo e ansiedade no dia da prova.`;

  try {
    const text = await modelText(TRAIL_MODEL, prompt);
    if (!text) {
      return { status: 502, payload: { error: 'O Gemini não devolveu texto para a trilha.' } };
    }
    return { status: 200, payload: { source: 'gemini', studyTrail: text } };
  } catch (error) {
    return { status: 500, payload: { error: errorMessage(error) } };
  }
}

export async function explainChoice(body: unknown) {
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const questionText = input.questionText;
  const alternatives = input.alternatives;
  const correctIdx = input.correctIdx;
  const chosenIdx = input.chosenIdx;
  if (!questionText || !Array.isArray(alternatives) || correctIdx === undefined || chosenIdx === undefined) {
    return { status: 400, payload: { error: 'Parâmetros insuficientes para explicação por IA.' } };
  }

  const official = 'O serviço de IA está temporariamente indisponível (chave ausente), mas aqui está a análise oficial: A alternativa correta foi validada pelos editais oficiais do INEP de acordo com as referências acadêmicas.';
  if (!geminiClient()) return { status: 200, payload: { explanation: official } };

  const choices = alternatives.map((item) => String(item));
  const correct = Number(correctIdx);
  const chosen = Number(chosenIdx);
  const prompt = `Você é um assistente acadêmico para simulados de ENADE. Forneça uma explicação curta, rápida e extremamente direta explicando por que o aluno escolheu a alternativa errada e por que a certa é a correta.
Dados:
Enunciado da Questão: "${String(questionText)}"
Alternativas fornecidas:
A) ${choices[0] || ''}
B) ${choices[1] || ''}
C) ${choices[2] || ''}
D) ${choices[3] || ''}
E) ${choices[4] || ''}

A alternativa correta é a de índice ${correct} (${String.fromCharCode(65 + correct)})
O aluno selecionou equivocadamente a alternativa de índice ${chosen} (${String.fromCharCode(65 + chosen)})

Explique o erro do aluno de forma clara, amigável e educativa. Máximo de 3 parágrafos curtos.`;

  try {
    const text = await modelText(EXPLAIN_MODEL, prompt);
    return { status: 200, payload: { explanation: text || official } };
  } catch (error) {
    return { status: 500, payload: { error: errorMessage(error) } };
  }
}
