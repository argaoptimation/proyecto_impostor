import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRandomWordEntry } from '../data/words';
import { bookVocabulary } from '../data/bookWords';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateGameWord(
  level: string,
  theme: string | null,
  useBookBank: boolean,
  usedWords: string[] = []
): Promise<{ word: string, hint: string }> {

  if (!apiKey) {
    const fallback = getRandomWordEntry(level);
    return { word: fallback.word, hint: 'Fallback' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

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
Tu tarea es analizar esta lista y ELEGIR LA PALABRA que mejor se adapte de forma DIRECTO, CLARO y OBVIO al tema solicitado ("${theme}").
FILTRO DE PRECISIÓN: La relación debe ser prototípica. No elijas conceptos abstractos o campos de estudio si el tema pide ejemplos concretos (ejemplo: si el tema es "Professions", no elijas "Sustainability" o "Psychology" a menos que sean la profesión exacta "Psychologist"). 
CRÍTICO: Si las únicas palabras disponibles en la lista tienen una relación débil, forzada o indirecta con el tema "${theme}", DEBES abortar y devolver EXACTAMENTE: { "word": "ERROR_NO_MATCH", "hint": "NONE" }.
OBLIGATORIO: BAJO NINGUNA CIRCUNSTANCIA inventes una palabra. Solo puedes devolver una palabra exacta de la lista o el error.
Es preferible NO entregar ninguna palabra antes que entregar una que confunda a los alumnos por no encajar perfectamente con el tema.`;
      } else {
        contextInstructions = `
CRÍTICO: La lista de palabras del libro está vacía para este nivel.
DEBES devolver EXACTAMENTE este JSON: { "word": "ERROR_NO_MATCH", "hint": "NONE" }.`;
      }
    }

    // 2. CONSTRUCCIÓN DEL PROMPT EN ESPAÑOL
    const forbiddenLogic = usedWords.length > 0
      ? `PROHIBIDO: No elijas ninguna de estas palabras (ya se usaron): [${usedWords.join(', ')}].`
      : "";

    const prompt = `Eres la inteligencia artificial de un juego educativo llamado 'The Impostor'.
Tu objetivo es elegir una PALABRA SECRETA y generar una PISTA (hint) para esa palabra.
Los resultados (palabra y pista) DEBEN estar en INGLÉS y ya que es para un instituto no pueden ser palabras ofensivas o subidas de tono.

CONTEXTO:
- Nivel de Inglés de los alumnos: CEFR ${level}.
- Tema solicitado: ${theme || "Tema general libre"}.
${contextInstructions}
${forbiddenLogic}
REGLAS ESTRICTAS PARA LA PISTA (HINT):
1. La pista DEBE ser EXACTAMENTE UNA PALABRA en inglés (un sustantivo o un adjetivo).
2. CRÍTICO: PROHIBIDO usar onomatopeyas (ej: no uses 'meow', 'woof', 'moo', 'beep', 'roar').
3. CRÍTICO: La pista debe ser una asociación conceptual, NO un sinónimo directo, NO la palabra misma, y NO el sonido que hace un animal o un objeto.
4. La palabra secreta elegida DEBE existir en el idioma inglés y estar escrita correctamente (salvo que devuelvas ERROR_NO_MATCH).

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