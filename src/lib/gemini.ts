import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRandomWordEntry } from '../data/words';
import { bookVocabulary } from '../data/bookWords';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateGameWord(
  level: string,
  theme: string | null,
  useBookBank: boolean
): Promise<{ word: string, hint: string }> {

  if (!apiKey) {
    const fallback = getRandomWordEntry(level);
    return { word: fallback.word, hint: 'Fallback' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 1. LÓGICA DE FILTRADO (DELEGADA A LA IA)
    let contextInstructions = "";

    if (useBookBank) {
      // Obtenemos TODAS las palabras del nivel (es una simple lista de strings ahora)
      const levelWords = bookVocabulary[level] || [];

      if (levelWords.length > 0) {
        const wordList = levelWords.join(', ');
        contextInstructions = `
MODO ESTRICTO: AI BOOK (Sincronización semántica con el plan de estudios).
Aquí tienes la lista completa de palabras autorizadas para el nivel ${level}: [${wordList}].
Tu tarea es analizar esta lista y ELEGIR LA PALABRA que mejor se adapte al tema solicitado ("${theme}").
Si ninguna palabra encaja perfectamente, elige la que más se acerque conceptualmente.
OBLIGATORIO: BAJO NINGUNA CIRCUNSTANCIA inventes una palabra. Solo puedes devolver una palabra exacta de la lista proporcionada.`;
      } else {
        contextInstructions = `
MODO: GENERAL AI (Búsqueda de respaldo).
El banco de palabras local está vacío para este nivel. Genera una palabra de nivel académico apropiado para CEFR ${level} relacionada con el tema "${theme}".`;
      }
    }

    // 2. CONSTRUCCIÓN DEL PROMPT EN ESPAÑOL
    const prompt = `Eres la inteligencia artificial de un juego educativo llamado 'The Impostor'.
Tu objetivo es elegir una PALABRA SECRETA y generar una PISTA (hint) para esa palabra.
Los resultados (palabra y pista) DEBEN estar en INGLÉS.

CONTEXTO:
- Nivel de Inglés de los alumnos: CEFR ${level}.
- Tema solicitado: ${theme || "Tema general libre"}.
${contextInstructions}

REGLAS ESTRICTAS PARA LA PISTA (HINT):
1. La pista DEBE ser EXACTAMENTE UNA PALABRA en inglés (un sustantivo o un adjetivo).
2. CRÍTICO: PROHIBIDO usar onomatopeyas (ej: no uses 'meow', 'woof', 'moo', 'beep', 'roar').
3. CRÍTICO: La pista debe ser una asociación conceptual, NO un sinónimo directo, NO la palabra misma, y NO el sonido que hace un animal o un objeto.
4. La palabra secreta elegida DEBE existir en el idioma inglés y estar escrita correctamente.

FORMATO DE SALIDA:
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional ni formato markdown:
{ "word": "LA_PALABRA_SECRETA_AQUI", "hint": "LA_PISTA_AQUI" }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Formato JSON inválido");
    const data = JSON.parse(jsonMatch[0]);

    return {
      word: data.word.toUpperCase(),
      hint: data.hint.toUpperCase()
    };

  } catch (error) {
    console.error('❌ Gemini Error:', error);
    const fallback = getRandomWordEntry(level);
    return { word: fallback.word, hint: '???' };
  }
}