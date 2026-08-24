import { GoogleGenerativeAI } from '@google/generative-ai';
import { bookVocabulary } from '../src/data/bookWords';

export default async function handler(req: any, res: any) {
  // CORS handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});
    const { level, theme, useBookBank, usedWords = [] } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ Server Error: GEMINI_API_KEY is not configured');
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    let contextInstructions = '';

    if (useBookBank) {
      const levelWords = bookVocabulary[level] || [];

      if (levelWords.length > 0) {
        const wordList = levelWords.join(', ');
        const themeGuidance = !theme || theme === 'Tema general libre'
          ? 'No hay un tema específico. Elige CUALQUIER palabra de la lista que sea interesante y variada para los alumnos.'
          : `ELEGIR LA PALABRA que mejor se adapte de forma DIRECTA, CLARA y OBVIA al tema solicitado ("${theme}").`;
        contextInstructions = `

MODO ESTRICTO: AI BOOK.
Lista de palabras autorizadas para ${level}: [${wordList}].
Tu tarea: ${themeGuidance}
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

    const prompt = `Eres la inteligencia artificial de un juego educativo llamado 'The Impostor'.
Tu objetivo es elegir una PALABRA SECRETA y generar una PISTA (hint) para esa palabra.
Los resultados (palabra y pista) DEBEN estar en INGLÉS y ya que es para un instituto no pueden ser palabras ofensivas o subidas de tono.

CONTEXTO:
- Nivel de Inglés: CEFR ${level}. LA PALABRA DEBE COINCIDIR ESTRICTAMENTE CON ESTE NIVEL DE DIFICULTAD. No elijas palabras básicas (A1/A2) si el nivel es avanzado (B2/C1/C2).
- Tema solicitado: "${theme || 'Tema general libre'}".
${contextInstructions}

REGLAS ESTRICTAS E INQUEBRANTABLES:
1. EXCLUSIÓN ABSOLUTA: Tienes ESTRICTAMENTE PROHIBIDO devolver cualquiera de estas palabras: [${usedWords.join(', ')}]. Si ignoras esta regla, romperás el juego. ¡NO REPITAS PALABRAS!
2. COHERENCIA TEMÁTICA: La palabra DEBE ser un ejemplo PERFECTO, COTIDIANO y DIRECTO del tema "${theme}". (Ejemplo: si el tema es "Pets", elige "Dog", "Cat" o "Hamster", NUNCA "Penguin", "Lion" o conceptos abstractos).
3. REGLAS PARA LA PISTA (HINT):
   - DEBE ser EXACTAMENTE UNA PALABRA (sustantivo o adjetivo).
   - PROHIBIDO usar onomatopeyas (ej: no 'meow', 'woof').
   - DEBE ser una asociación conceptual indirecta.
   - ¡PROHIBICIÓN ABSOLUTA!: La pista NUNCA puede ser la misma palabra secreta, ni contener la palabra secreta.
   - NO puede ser un sinónimo directo ni el sonido del objeto/animal.
4. VALIDACIÓN FINAL: Si sientes la tentación de elegir una palabra que encaja "más o menos", O si la única palabra disponible ya está en la lista de exclusión, DEBES abortar y devolver EXACTAMENTE: { "word": "ERROR_NO_MATCH", "hint": "NONE" }.

FORMATO DE SALIDA:
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional ni formato markdown:
{ "word": "LA_PALABRA", "hint": "LA_PISTA" }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Formato JSON inválido devuelto por la IA');
    }

    const data = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      word: data.word ? data.word.toUpperCase() : 'ERROR_NO_MATCH',
      hint: data.hint ? data.hint.toUpperCase() : 'NONE'
    });
  } catch (error: any) {
    console.error('❌ Server Gemini Error:', error);
    return res.status(500).json({ error: error.message || 'Error generating word' });
  }
}
