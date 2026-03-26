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
  { word: 'HOSPITAL', hints: ['People go here when sick', 'Doctors work here'] },
  { word: 'AIRPORT', hints: ['You fly from here', 'Has runways and gates'] },
  { word: 'SUPERMARKET', hints: ['Buy food here', 'Has many aisles'] },
  { word: 'SCHOOL', hints: ['Children learn here', 'Has classrooms'] },
  { word: 'GARDEN', hints: ['Plants grow here', 'Usually outside the house'] },
  { word: 'KITCHEN', hints: ['You cook here', 'Has an oven and fridge'] },
  { word: 'BEDROOM', hints: ['You sleep here', 'Has a bed and pillow'] },
  { word: 'TELEVISION', hints: ['You watch shows on it', 'Has a screen'] },
  { word: 'COMPUTER', hints: ['You type on it', 'Has a keyboard and screen'] },
  { word: 'TELEPHONE', hints: ['You call people with it', 'It rings'] },
  { word: 'BICYCLE', hints: ['Has two wheels', 'You pedal it'] },
  { word: 'BREAKFAST', hints: ['First meal of the day', 'Eggs and toast'] },
  { word: 'SANDWICH', hints: ['Two slices of bread', 'Quick lunch food'] },
  { word: 'CHOCOLATE', hints: ['Sweet and brown', 'Made from cocoa'] },
  { word: 'BIRTHDAY', hints: ['Celebrated once a year', 'You get a cake'] },
  { word: 'TEACHER', hints: ['Works at a school', 'Helps students learn'] },
  { word: 'STUDENT', hints: ['Goes to school', 'Does homework'] },
  { word: 'DOCTOR', hints: ['Wears a white coat', 'Checks your health'] },
  { word: 'POLICEMAN', hints: ['Wears a uniform', 'Keeps people safe'] },
  { word: 'ELEPHANT', hints: ['Very big animal', 'Has a long trunk'] },
  { word: 'GIRAFFE', hints: ['Very tall animal', 'Has a long neck'] },
  { word: 'PENGUIN', hints: ['Black and white bird', 'Lives in cold places'] },
  { word: 'UMBRELLA', hints: ['Protects from rain', 'You open it above you'] },
  { word: 'RAINBOW', hints: ['Has seven colors', 'Appears after rain'] },
  { word: 'MOUNTAIN', hints: ['Very high land', 'You climb it'] },
  { word: 'BEACH', hints: ['Sand and water', 'Good for swimming'] },
  { word: 'GUITAR', hints: ['Musical instrument', 'Has six strings'] },
  { word: 'SOCCER', hints: ['Popular sport', 'You kick a ball'] },
  { word: 'BASKETBALL', hints: ['Indoor sport', 'You throw into a hoop'] },
  { word: 'TICKET', hints: ['You need it to enter', 'Paper or digital proof'] },
  { word: 'JACKET', hints: ['You wear it when cold', 'Goes over your shirt'] },
  { word: 'SWEATER', hints: ['Warm clothing', 'Made of wool or cotton'] },
  { word: 'LIBRARY', hints: ['Full of books', 'Very quiet place'] },
  { word: 'MORNING', hints: ['Start of the day', 'Before afternoon'] },
  { word: 'WEEKEND', hints: ['Saturday and Sunday', 'No school these days'] },
  { word: 'FAMILY', hints: ['Parents and children', 'People you live with'] },
  { word: 'FRIEND', hints: ['Someone you like', 'You play together'] },
  { word: 'HOLIDAY', hints: ['No work or school', 'Time to rest and travel'] },
  { word: 'PASSPORT', hints: ['Needed for travel', 'Has your photo inside'] },
  { word: 'POTATO', hints: ['Grows underground', 'Used to make fries'] },
];

// ── A2 (Elementary) ────────────────────────────────────────────────────────
export const LEVEL_A2_WORDS: WordEntry[] = [
  { word: 'MUSEUM', hints: ['Has old things to see', 'Art or history inside'] },
  { word: 'THEATRE', hints: ['Watch plays here', 'Has a stage'] },
  { word: 'STADIUM', hints: ['Sports events happen here', 'Thousands of seats'] },
  { word: 'PHARMACY', hints: ['Buy medicine here', 'Near a hospital'] },
  { word: 'RESTAURANT', hints: ['You eat meals here', 'A waiter serves you'] },
  { word: 'VILLAGE', hints: ['Smaller than a city', 'Few people live here'] },
  { word: 'JOURNEY', hints: ['A long trip', 'Travel from A to B'] },
  { word: 'LUGGAGE', hints: ['Bags for travel', 'You pack clothes in it'] },
  { word: 'UNIFORM', hints: ['Same clothes for a group', 'Students or police wear it'] },
  { word: 'INSTRUMENT', hints: ['Makes music', 'Piano or violin'] },
  { word: 'KEYBOARD', hints: ['Part of a computer', 'Has letters and numbers'] },
  { word: 'MAGAZINE', hints: ['Has colorful pages', 'Monthly publication'] },
  { word: 'NEWSPAPER', hints: ['Has daily information', 'Made of thin paper'] },
  { word: 'ADVERTISEMENT', hints: ['Promotes a product', 'You see it on TV or online'] },
  { word: 'ENVELOPE', hints: ['Holds a letter', 'You write an address on it'] },
  { word: 'NEIGHBOUR', hints: ['Lives next to you', 'Close to your house'] },
  { word: 'COLLEAGUE', hints: ['Works with you', 'Same office or team'] },
  { word: 'ENGINEER', hints: ['Designs or builds things', 'Uses math and science'] },
  { word: 'ARCHITECT', hints: ['Designs buildings', 'Draws floor plans'] },
  { word: 'DENTIST', hints: ['Checks your teeth', 'Works in a clinic'] },
  { word: 'MECHANIC', hints: ['Fixes cars', 'Works in a garage'] },
  { word: 'WAITER', hints: ['Serves food', 'Works in a restaurant'] },
  { word: 'SCIENTIST', hints: ['Does experiments', 'Works in a laboratory'] },
  { word: 'CHEMISTRY', hints: ['Study of substances', 'Mixing elements'] },
  { word: 'BIOLOGY', hints: ['Study of living things', 'Plants and animals'] },
  { word: 'HISTORY', hints: ['Study of the past', 'Ancient events'] },
  { word: 'SUBJECT', hints: ['Topic in school', 'Math or English'] },
  { word: 'SCHEDULE', hints: ['Plan for the day', 'Times and activities'] },
  { word: 'INTERVIEW', hints: ['Questions and answers', 'For a job or news'] },
  { word: 'APPOINTMENT', hints: ['Scheduled meeting', 'At a specific time'] },
  { word: 'CELEBRATION', hints: ['A happy event', 'Parties and decorations'] },
  { word: 'COMPETITION', hints: ['You try to win', 'Against other people'] },
  { word: 'PERFORMANCE', hints: ['On a stage', 'People watch you'] },
  { word: 'SOUVENIR', hints: ['A memory from a trip', 'Small gift or item'] },
  { word: 'BACKPACK', hints: ['Carry on your back', 'Has zippers and pockets'] },
  { word: 'SUNGLASSES', hints: ['Protect your eyes', 'Wear them in summer'] },
  { word: 'HEADPHONES', hints: ['Listen to music', 'Cover your ears'] },
  { word: 'CALENDAR', hints: ['Shows months and days', 'Plan your week'] },
  { word: 'TEMPERATURE', hints: ['Hot or cold', 'Measured in degrees'] },
  { word: 'ENVIRONMENT', hints: ['Nature around us', 'Air, water and land'] },
];

// ── B1 (Intermediate) ──────────────────────────────────────────────────────
export const LEVEL_B1_WORDS: WordEntry[] = [
  { word: 'ADVENTURE', hints: ['An exciting experience', 'Exploring the unknown'] },
  { word: 'AMBITION', hints: ['Strong desire to succeed', 'A personal goal'] },
  { word: 'ATTITUDE', hints: ['Way of thinking', 'Positive or negative'] },
  { word: 'CAPACITY', hints: ['Maximum amount', 'How much it can hold'] },
  { word: 'CHALLENGE', hints: ['Something difficult', 'Tests your ability'] },
  { word: 'CHARACTER', hints: ['Personality traits', 'Who someone really is'] },
  { word: 'CITIZEN', hints: ['Lives in a country', 'Has rights and duties'] },
  { word: 'COMMUNITY', hints: ['Group of people', 'Living in the same area'] },
  { word: 'CONFIDENCE', hints: ['Believing in yourself', 'Opposite of doubt'] },
  { word: 'CONFLICT', hints: ['A disagreement', 'Two sides oppose each other'] },
  { word: 'CONTEXT', hints: ['The situation around something', 'Helps understanding'] },
  { word: 'CREATIVITY', hints: ['Making new things', 'Using imagination'] },
  { word: 'CRITICISM', hints: ['Judging something', 'Can be positive or negative'] },
  { word: 'DECISION', hints: ['A choice you make', 'After thinking carefully'] },
  { word: 'DEFINITION', hints: ['Meaning of a word', 'Found in a dictionary'] },
  { word: 'DISCOVERY', hints: ['Finding something new', 'Scientists make these'] },
  { word: 'EDUCATION', hints: ['Learning and teaching', 'Schools and universities'] },
  { word: 'EMOTION', hints: ['A feeling inside', 'Joy, anger, or sadness'] },
  { word: 'EXPERIENCE', hints: ['Something you lived through', 'Teaches you lessons'] },
  { word: 'FACTOR', hints: ['Something that affects results', 'An important element'] },
  { word: 'FESTIVAL', hints: ['A big celebration', 'Music, food, and culture'] },
  { word: 'GENERATION', hints: ['People born around the same time', 'Parents to children'] },
  { word: 'GOVERNMENT', hints: ['Runs a country', 'Makes laws and rules'] },
  { word: 'IDENTITY', hints: ['Who you are', 'Name, face, and personality'] },
  { word: 'INDUSTRY', hints: ['Making and selling products', 'Factories and businesses'] },
  { word: 'INFLUENCE', hints: ['Power to change others', 'Can be good or bad'] },
  { word: 'INFORMATION', hints: ['Facts and data', 'Found online or in books'] },
  { word: 'INNOVATION', hints: ['A new idea or method', 'Improves how things work'] },
  { word: 'INSURANCE', hints: ['Protection against loss', 'You pay monthly for it'] },
  { word: 'INTENTION', hints: ['What you plan to do', 'A purpose or aim'] },
  { word: 'KNOWLEDGE', hints: ['What you know', 'Gained from study or experience'] },
  { word: 'LITERATURE', hints: ['Written works of art', 'Books, poems, and plays'] },
  { word: 'MANAGEMENT', hints: ['Controlling a business', 'Organizing people and tasks'] },
  { word: 'NETWORK', hints: ['Connected group', 'People or computers linked'] },
  { word: 'OPPORTUNITY', hints: ['A good chance', 'Could lead to success'] },
  { word: 'PATIENCE', hints: ['Waiting calmly', 'Not getting frustrated'] },
  { word: 'POPULATION', hints: ['Number of people', 'In a city or country'] },
  { word: 'POSSIBILITY', hints: ['Something that could happen', 'Not a certainty'] },
  { word: 'RELIGION', hints: ['Belief in a higher power', 'Spiritual practice'] },
  { word: 'STRATEGY', hints: ['A plan of action', 'Steps to achieve a goal'] },
];

// ── B2 (Upper Intermediate) ────────────────────────────────────────────────
export const LEVEL_B2_WORDS: WordEntry[] = [
  { word: 'INVESTMENT', hints: ['Putting money into something', 'Expecting future profit'] },
  { word: 'ACCOMMODATION', hints: ['Place to stay', 'Hotel or rental'] },
  { word: 'ACQUISITION', hints: ['Getting something new', 'Buying a company or skill'] },
  { word: 'AMBIGUITY', hints: ['More than one meaning', 'Not clear or certain'] },
  { word: 'ARCHITECTURE', hints: ['Design of buildings', 'Art and structure combined'] },
  { word: 'CONSEQUENCE', hints: ['Result of an action', 'Can be good or bad'] },
  { word: 'CONTROVERSY', hints: ['Public disagreement', 'People have strong opinions'] },
  { word: 'CURRENCY', hints: ['Money used in a country', 'Dollars, euros, or pesos'] },
  { word: 'DEFICIT', hints: ['More spending than income', 'A financial shortage'] },
  { word: 'DIVERSITY', hints: ['Many different types', 'Variety in people or ideas'] },
  { word: 'ECONOMY', hints: ['System of money and trade', 'Can grow or shrink'] },
  { word: 'EFFICIENCY', hints: ['Doing more with less', 'No wasted time or resources'] },
  { word: 'ESTIMATE', hints: ['An educated guess', 'Approximate calculation'] },
  { word: 'EVIDENCE', hints: ['Proof of something', 'Used in court or science'] },
  { word: 'EXPANSION', hints: ['Growing larger', 'A business or territory'] },
  { word: 'EXPLOITATION', hints: ['Unfair use of resources', 'Taking advantage of others'] },
  { word: 'FOUNDATION', hints: ['Base of a structure', 'Starting point of an idea'] },
  { word: 'GUARANTEE', hints: ['A promise of quality', 'Money back if broken'] },
  { word: 'HIERARCHY', hints: ['Ranked order', 'Top to bottom structure'] },
  { word: 'HYPOTHESIS', hints: ['A scientific guess', 'Tested with experiments'] },
  { word: 'INFRASTRUCTURE', hints: ['Roads, bridges, systems', 'What a city is built on'] },
  { word: 'INHERITANCE', hints: ['Received from family', 'After someone passes away'] },
  { word: 'INITIATIVE', hints: ['Taking the first step', 'Acting without being told'] },
  { word: 'INSTITUTION', hints: ['An established organization', 'Bank, school, or government'] },
  { word: 'INTEGRITY', hints: ['Being honest and moral', 'Doing the right thing'] },
  { word: 'INTERPRETATION', hints: ['Explaining the meaning', 'Different views of the same thing'] },
  { word: 'LEGISLATION', hints: ['Laws and rules', 'Made by government'] },
  { word: 'LIBERTY', hints: ['Freedom from control', 'A fundamental right'] },
  { word: 'MOTIVATION', hints: ['Reason to act', 'Internal drive'] },
  { word: 'NEGOTIATION', hints: ['Discussing to reach agreement', 'Both sides compromise'] },
  { word: 'PHILOSOPHY', hints: ['Study of fundamental questions', 'Love of wisdom'] },
  { word: 'PRIORITY', hints: ['Most important thing', 'What comes first'] },
  { word: 'PSYCHOLOGY', hints: ['Study of the mind', 'How people think and feel'] },
  { word: 'REVOLUTION', hints: ['A major change', 'Overthrow of a system'] },
  { word: 'SATISFACTION', hints: ['Feeling pleased', 'Getting what you wanted'] },
  { word: 'STATISTICS', hints: ['Numbers and data', 'Used to find patterns'] },
  { word: 'SUSTAINABILITY', hints: ['Long-term viability', 'Protecting the environment'] },
  { word: 'TECHNOLOGY', hints: ['Modern tools and machines', 'Computers and phones'] },
  { word: 'TOLERANCE', hints: ['Accepting differences', 'Patience with others'] },
  { word: 'TRANSFORMATION', hints: ['Complete change', 'Before and after'] },
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
