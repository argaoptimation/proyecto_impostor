import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRandomWordEntry, getHintsForWord } from '../data/words';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateGameWord(level: string, theme: string | null): Promise<{ word: string, hint: string }> {
  if (!apiKey) {
    console.warn('⚠️ Gemini API Key not found. Using local fallback.');
    const fallback = getRandomWordEntry(level);
    const hints = getHintsForWord(fallback.word, level);
    return { word: fallback.word, hint: hints ? hints[0] : 'Unknown' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Definimos el prompt limpio y profesional en un solo bloque
    const prompt = `You are a specialized game engine for 'The Impostor', an educational English learning game. 
    Your goal is to generate a SECRET WORD and a corresponding HINT for students.

    CONTEXT:
    - Target English Level: CEFR ${level}.
    - Theme Constraint: ${theme ? `The word MUST be strictly related to the theme: "${theme}"` : "Random general topic"}.

    STRICT RULES:
    1. WORD COMPLEXITY: For B1/B2/C1/C2 levels, avoid basic nouns (like 'apple', 'house'). Use academic, professional or field-specific vocabulary. For A1/A2, keep it simple but engaging.
    2. WORD INTEGRITY: The secret word MUST be a real, grammatically correct English word. No typos allowed.
    3. SEMANTIC ADHERENCE: If a theme is provided, do NOT generate words from unrelated fields.
    4. HINT LOGIC: The hint MUST be exactly ONE word. It should be a conceptual association, NOT a direct definition, and NOT the word itself. It must help the Impostor blend in without giving the word away immediately.
    5. OUTPUT FORMAT: Return ONLY a raw JSON object. No markdown, no explanations.

    FORMAT:
    {
      "word": "SECRET_WORD",
      "hint": "ASSOCIATED_HINT"
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response in case markdown blocks are present
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid format from Gemini");
    }

    const data = JSON.parse(jsonMatch[0]);
    if (!data.word || !data.hint) {
      throw new Error("Missing word or hint in Gemini response");
    }

    return {
      word: data.word.toUpperCase(),
      hint: data.hint.toUpperCase()
    };

  } catch (error) {
    console.error('❌ Gemini word generation failed:', error);
    // Fallback logic
    const fallback = getRandomWordEntry(level);
    const hints = getHintsForWord(fallback.word, level);
    return { word: fallback.word, hint: hints ? hints[0] : 'Unknown' };
  }
}
