import { getRandomWordEntry } from '../data/words';

export async function generateGameWord(
  level: string,
  theme: string | null,
  useBookBank: boolean,
  usedWords: string[] = []
): Promise<{ word: string, hint: string }> {
  try {
    const response = await fetch('/api/generate-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        theme,
        useBookBank,
        usedWords
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('⚠️ Server /api/generate-word returned error:', errData);
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!data.word) {
      throw new Error('Respuesta inválida del servidor');
    }

    return {
      word: data.word.toUpperCase(),
      hint: data.hint ? data.hint.toUpperCase() : ''
    };
  } catch (error) {
    console.error('❌ Gemini Serverless Error:', error);
    const fallback = getRandomWordEntry(level);
    return { word: fallback.word, hint: '???' };
  }
}