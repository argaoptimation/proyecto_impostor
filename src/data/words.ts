// ─────────────────────────────────────────────────────────────────────────────
// WORD BANK — CEFR Level Dictionaries with Fixed Hints
// Each WordEntry contains the word and 2 fixed hints. Hints are designed to
// give the Impostor a fighting chance by hinting at the word category and usage.
//
// ── FUTURE AI: To replace fixed hints with AI-generated hints, implement the
//    function stub `generateAIHints(word)` at the bottom of this file. The game
//    logic already calls `getRandomWordEntry()` which returns a full WordEntry.
//    Swap the hints array at call time when AI is ready.
// ─────────────────────────────────────────────────────────────────────────────

export interface WordEntry {
  word: string;
  hints: [string, string];
}

// ── A1 (Beginner) ──────────────────────────────────────────────────────────
export const LEVEL_A1_WORDS: WordEntry[] = [
  { word: 'HOSPITAL', hints: ['Health', 'Nurse'] },
  { word: 'AIRPORT', hints: ['Flight', 'Travel'] },
  { word: 'SUPERMARKET', hints: ['Basket', 'Buy'] },
  { word: 'SCHOOL', hints: ['Lesson', 'Desk'] },
  { word: 'GARDEN', hints: ['Plant', 'Flower'] },
  { word: 'KITCHEN', hints: ['Cook', 'Plate'] },
  { word: 'BEDROOM', hints: ['Dream', 'Rest'] },
  { word: 'TELEVISION', hints: ['Screen', 'Channel'] },
  { word: 'COMPUTER', hints: ['Screen', 'Mouse'] },
  { word: 'TELEPHONE', hints: ['Ring', 'Voice'] },
  { word: 'BICYCLE', hints: ['Motion', 'Sport'] },
  { word: 'BREAKFAST', hints: ['Morning', 'Cereal'] },
  { word: 'SANDWICH', hints: ['Bread', 'Snack'] },
  { word: 'CHOCOLATE', hints: ['Cacao', 'Dessert'] },
  { word: 'BIRTHDAY', hints: ['Gift', 'Candle'] },
  { word: 'TEACHER', hints: ['Board', 'Test'] },
  { word: 'STUDENT', hints: ['Study', 'Exam'] },
  { word: 'DOCTOR', hints: ['Clinic', 'Sick'] },
  { word: 'POLICEMAN', hints: ['Law', 'Arrest'] },
  { word: 'ELEPHANT', hints: ['Zoo', 'Grey'] },
  { word: 'GIRAFFE', hints: ['Tall', 'Leaves'] },
  { word: 'PENGUIN', hints: ['Ice', 'Bird'] },
  { word: 'UMBRELLA', hints: ['Rain', 'Dry'] },
  { word: 'RAINBOW', hints: ['Color', 'Sky'] },
  { word: 'MOUNTAIN', hints: ['High', 'Rock'] },
  { word: 'BEACH', hints: ['Sand', 'Ocean'] },
  { word: 'GUITAR', hints: ['Music', 'Band'] },
  { word: 'SOCCER', hints: ['Goal', 'Kick'] },
  { word: 'BASKETBALL', hints: ['Hoop', 'Court'] },
  { word: 'TICKET', hints: ['Pay', 'Enter'] },
  { word: 'JACKET', hints: ['Cold', 'Wear'] },
  { word: 'SWEATER', hints: ['Warm', 'Winter'] },
  { word: 'LIBRARY', hints: ['Quiet', 'Read'] },
  { word: 'MORNING', hints: ['Early', 'Wake'] },
  { word: 'WEEKEND', hints: ['Relax', 'Free'] },
  { word: 'FAMILY', hints: ['Parent', 'Child'] },
  { word: 'FRIEND', hints: ['Play', 'Together'] },
  { word: 'HOLIDAY', hints: ['Trip', 'Hotel'] },
  { word: 'PASSPORT', hints: ['Border', 'Identity'] },
  { word: 'POTATO', hints: ['Farm', 'Vegetable'] },
];

// ── A2 (Elementary) ────────────────────────────────────────────────────────
export const LEVEL_A2_WORDS: WordEntry[] = [
  { word: 'MUSEUM', hints: ['Exhibit', 'Gallery'] },
  { word: 'THEATRE', hints: ['Stage', 'Actor'] },
  { word: 'STADIUM', hints: ['Match', 'Crowd'] },
  { word: 'PHARMACY', hints: ['Pill', 'Cure'] },
  { word: 'RESTAURANT', hints: ['Menu', 'Chef'] },
  { word: 'VILLAGE', hints: ['Rural', 'Local'] },
  { word: 'JOURNEY', hints: ['Distance', 'Route'] },
  { word: 'LUGGAGE', hints: ['Pack', 'Heavy'] },
  { word: 'UNIFORM', hints: ['Same', 'Rule'] },
  { word: 'INSTRUMENT', hints: ['Sound', 'Play'] },
  { word: 'KEYBOARD', hints: ['Type', 'Button'] },
  { word: 'MAGAZINE', hints: ['Page', 'Article'] },
  { word: 'NEWSPAPER', hints: ['Daily', 'Press'] },
  { word: 'ADVERTISEMENT', hints: ['Sale', 'Brand'] },
  { word: 'ENVELOPE', hints: ['Stamp', 'Post'] },
  { word: 'NEIGHBOUR', hints: ['Next', 'House'] },
  { word: 'COLLEAGUE', hints: ['Office', 'Job'] },
  { word: 'ENGINEER', hints: ['Build', 'Design'] },
  { word: 'ARCHITECT', hints: ['Plan', 'Structure'] },
  { word: 'DENTIST', hints: ['Tooth', 'Smile'] },
  { word: 'MECHANIC', hints: ['Engine', 'Repair'] },
  { word: 'WAITER', hints: ['Serve', 'Tray'] },
  { word: 'SCIENTIST', hints: ['Lab', 'Research'] },
  { word: 'CHEMISTRY', hints: ['Acid', 'Reaction'] },
  { word: 'BIOLOGY', hints: ['Cell', 'Life'] },
  { word: 'HISTORY', hints: ['Past', 'Century'] },
  { word: 'SUBJECT', hints: ['Topic', 'Class'] },
  { word: 'SCHEDULE', hints: ['Time', 'Plan'] },
  { word: 'INTERVIEW', hints: ['Question', 'Hire'] },
  { word: 'APPOINTMENT', hints: ['Meeting', 'Date'] },
  { word: 'CELEBRATION', hints: ['Joy', 'Event'] },
  { word: 'COMPETITION', hints: ['Race', 'Win'] },
  { word: 'PERFORMANCE', hints: ['Show', 'Audience'] },
  { word: 'SOUVENIR', hints: ['Memory', 'Gift'] },
  { word: 'BACKPACK', hints: ['Carry', 'Hike'] },
  { word: 'SUNGLASSES', hints: ['Shade', 'Summer'] },
  { word: 'HEADPHONES', hints: ['Listen', 'Audio'] },
  { word: 'CALENDAR', hints: ['Month', 'Date'] },
  { word: 'TEMPERATURE', hints: ['Degree', 'Weather'] },
  { word: 'ENVIRONMENT', hints: ['Nature', 'Planet'] },
];

// ── B1 (Intermediate) ──────────────────────────────────────────────────────
export const LEVEL_B1_WORDS: WordEntry[] = [
  { word: 'ADVENTURE', hints: ['Thrill', 'Risk'] },
  { word: 'AMBITION', hints: ['Drive', 'Goal'] },
  { word: 'ATTITUDE', hints: ['Mindset', 'Mood'] },
  { word: 'CAPACITY', hints: ['Volume', 'Limit'] },
  { word: 'CHALLENGE', hints: ['Struggle', 'Task'] },
  { word: 'CHARACTER', hints: ['Trait', 'Moral'] },
  { word: 'CITIZEN', hints: ['Civic', 'Vote'] },
  { word: 'COMMUNITY', hints: ['Society', 'Public'] },
  { word: 'CONFIDENCE', hints: ['Belief', 'Bold'] },
  { word: 'CONFLICT', hints: ['Clash', 'Dispute'] },
  { word: 'CONTEXT', hints: ['Setting', 'Frame'] },
  { word: 'CREATIVITY', hints: ['Vision', 'Original'] },
  { word: 'CRITICISM', hints: ['Review', 'Flaw'] },
  { word: 'DECISION', hints: ['Choice', 'Resolve'] },
  { word: 'DEFINITION', hints: ['Meaning', 'Term'] },
  { word: 'DISCOVERY', hints: ['Find', 'Uncover'] },
  { word: 'EDUCATION', hints: ['Degree', 'Academic'] },
  { word: 'EMOTION', hints: ['Feeling', 'Tear'] },
  { word: 'EXPERIENCE', hints: ['Practice', 'Wisdom'] },
  { word: 'FACTOR', hints: ['Cause', 'Aspect'] },
  { word: 'FESTIVAL', hints: ['Carnival', 'Culture'] },
  { word: 'GENERATION', hints: ['Era', 'Youth'] },
  { word: 'GOVERNMENT', hints: ['Law', 'State'] },
  { word: 'IDENTITY', hints: ['Self', 'Profile'] },
  { word: 'INDUSTRY', hints: ['Factory', 'Sector'] },
  { word: 'INFLUENCE', hints: ['Impact', 'Sway'] },
  { word: 'INFORMATION', hints: ['Data', 'Source'] },
  { word: 'INNOVATION', hints: ['Novelty', 'Tech'] },
  { word: 'INSURANCE', hints: ['Policy', 'Claim'] },
  { word: 'INTENTION', hints: ['Motive', 'Aim'] },
  { word: 'KNOWLEDGE', hints: ['Fact', 'Insight'] },
  { word: 'LITERATURE', hints: ['Novel', 'Poetry'] },
  { word: 'MANAGEMENT', hints: ['Control', 'Lead'] },
  { word: 'NETWORK', hints: ['Link', 'Web'] },
  { word: 'OPPORTUNITY', hints: ['Chance', 'Prospect'] },
  { word: 'PATIENCE', hints: ['Calm', 'Wait'] },
  { word: 'POPULATION', hints: ['Census', 'Crowd'] },
  { word: 'POSSIBILITY', hints: ['Option', 'Likely'] },
  { word: 'RELIGION', hints: ['Faith', 'Divine'] },
  { word: 'STRATEGY', hints: ['Tactic', 'Scheme'] },
];

// ── B2 (Upper Intermediate) ────────────────────────────────────────────────
export const LEVEL_B2_WORDS: WordEntry[] = [
  { word: 'INVESTMENT', hints: ['Asset', 'Dividend'] },
  { word: 'ACCOMMODATION', hints: ['Lodging', 'Shelter'] },
  { word: 'ACQUISITION', hints: ['Merger', 'Purchase'] },
  { word: 'AMBIGUITY', hints: ['Vague', 'Unclear'] },
  { word: 'ARCHITECTURE', hints: ['Blueprint', 'Aesthetic'] },
  { word: 'CONSEQUENCE', hints: ['Aftermath', 'Outcome'] },
  { word: 'CONTROVERSY', hints: ['Scandal', 'Debate'] },
  { word: 'CURRENCY', hints: ['Exchange', 'Tender'] },
  { word: 'DEFICIT', hints: ['Shortfall', 'Debt'] },
  { word: 'DIVERSITY', hints: ['Variety', 'Inclusion'] },
  { word: 'ECONOMY', hints: ['Market', 'Wealth'] },
  { word: 'EFFICIENCY', hints: ['Productive', 'Optimal'] },
  { word: 'ESTIMATE', hints: ['Projection', 'Guess'] },
  { word: 'EVIDENCE', hints: ['Proof', 'Clue'] },
  { word: 'EXPANSION', hints: ['Growth', 'Spread'] },
  { word: 'EXPLOITATION', hints: ['Abuse', 'Greed'] },
  { word: 'FOUNDATION', hints: ['Basis', 'Core'] },
  { word: 'GUARANTEE', hints: ['Warranty', 'Assurance'] },
  { word: 'HIERARCHY', hints: ['Ranking', 'Status'] },
  { word: 'HYPOTHESIS', hints: ['Premise', 'Theory'] },
  { word: 'INFRASTRUCTURE', hints: ['Framework', 'Utility'] },
  { word: 'INHERITANCE', hints: ['Legacy', 'Heir'] },
  { word: 'INITIATIVE', hints: ['Proactive', 'Drive'] },
  { word: 'INSTITUTION', hints: ['Academy', 'Agency'] },
  { word: 'INTEGRITY', hints: ['Virtue', 'Ethics'] },
  { word: 'INTERPRETATION', hints: ['Analysis', 'Perspective'] },
  { word: 'LEGISLATION', hints: ['Statute', 'Parliament'] },
  { word: 'LIBERTY', hints: ['Autonomy', 'Freedom'] },
  { word: 'MOTIVATION', hints: ['Incentive', 'Stimulus'] },
  { word: 'NEGOTIATION', hints: ['Diplomacy', 'Bargain'] },
  { word: 'PHILOSOPHY', hints: ['Ideology', 'Logic'] },
  { word: 'PRIORITY', hints: ['Urgency', 'Precedence'] },
  { word: 'PSYCHOLOGY', hints: ['Therapy', 'Cognitive'] },
  { word: 'REVOLUTION', hints: ['Uprising', 'Rebellion'] },
  { word: 'SATISFACTION', hints: ['Fulfillment', 'Contentment'] },
  { word: 'STATISTICS', hints: ['Probability', 'Metric'] },
  { word: 'SUSTAINABILITY', hints: ['Conservation', 'Renewable'] },
  { word: 'TECHNOLOGY', hints: ['Digital', 'Algorithm'] },
  { word: 'TOLERANCE', hints: ['Openness', 'Patience'] },
  { word: 'TRANSFORMATION', hints: ['Metamorphosis', 'Shift'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// CORE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const DICTIONARIES: Record<string, WordEntry[]> = {
  A1: LEVEL_A1_WORDS,
  A2: LEVEL_A2_WORDS,
  B1: LEVEL_B1_WORDS,
  B2: LEVEL_B2_WORDS,
};

/**
 * Returns a random WordEntry (word + hints) for the given CEFR level.
 * This is the primary function the game uses.
 */
export const getRandomWordEntry = (level: string): WordEntry => {
  const dict = DICTIONARIES[level?.toUpperCase()] || LEVEL_A1_WORDS;
  return dict[Math.floor(Math.random() * dict.length)];
};

/**
 * Legacy compatibility: returns just the word string.
 * Used by existing callers. Will be deprecated when all callers switch to getRandomWordEntry.
 */
export const getRandomWord = (level: string): string => {
  return getRandomWordEntry(level).word;
};

/**
 * Find a WordEntry by its word string (case-insensitive).
 * Used to retrieve hints for a word that's already been selected.
 */
export const getHintsForWord = (word: string, level: string): [string, string] | null => {
  const dict = DICTIONARIES[level?.toUpperCase()] || LEVEL_A1_WORDS;
  const entry = dict.find(e => e.word.toUpperCase() === word?.toUpperCase());
  return entry ? entry.hints : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// FUTURE AI INTEGRATION STUB
// Replace the body of this function with an API call to generate dynamic hints.
// Example: const response = await fetch('/api/generate-hints', { body: { word } });
// ─────────────────────────────────────────────────────────────────────────────
export const generateAIHints = async (word: string): Promise<[string, string]> => {
  // ── PHASE 2 STUB: Currently returns the static hints from the dictionary.
  // When AI is ready, this function should call your AI endpoint and return
  // a tuple of two dynamically generated hints.
  const allWords = [...LEVEL_A1_WORDS, ...LEVEL_A2_WORDS, ...LEVEL_B1_WORDS, ...LEVEL_B2_WORDS];
  const entry = allWords.find(e => e.word.toUpperCase() === word?.toUpperCase());
  return entry ? entry.hints : ['Think about its category', 'Used in daily life'];
};
