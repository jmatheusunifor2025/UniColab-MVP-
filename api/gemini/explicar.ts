import { explainChoice } from '../_gemini';

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => { json: (body: unknown) => void };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }
  const result = await explainChoice(req.body);
  res.status(result.status).json(result.payload);
}
