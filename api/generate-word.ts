import { GoogleGenerativeAI } from '@google/generative-ai';

// ── VOCABULARIO DE LIBROS CIL LENGUAS ──
const bookVocabulary: Record<string, string[]> = {
  A2_PLUS: [
    "ARTIST", "PYRAMID", "GRAFFITI", "TOWN", "NURSE", "HOSPITAL", "CARPENTER", "BOAT", "CAT", "KAYAK", "SCHOOL", "SANDWICH", "SNAKE", "COUSIN", "COMPUTER", "SPECIALIST", "PRINTER", "SCULPTURE", "CHEF", "FARMER", "MECHANIC", "HAIRDRESSER", "SCIENTIST", "DENTIST", "CAP", "HOODIE", "SHIRT", "UNIFORM", "TIE", "EARRING", "PHONE", "BATTERY", "CABLE", "CHARGER", "EARPHONES", "PLUG", "SELFIE STICK", "SPEAKER", "TABLET", "CAMERA", "SHOES", "BAND", "PHOTOGRAPHER", "REPORTER", "SKATEBOARD", "HELMET", "BUS", "SKATEBOARDER", "PLASTIC", "HANDS", "CONTROLLER", "RUCKSACK", "BAG", "TABLE", "POSTER", "LIFE JACKET", "CERTIFICATE", "MUSEUM", "EXHIBITION", "ROBOT", "REINDEER", "FISH", "WOOD", "KNIFE", "SACK", "WHALE", "PENGUIN", "SHARK", "SEAL", "DOLPHIN", "MANATEE", "WAVES", "CLOUDS", "VEGETATION", "MANGROVE", "FOREST", "BREAD", "CHEESE", "CHEWING GUM", "CHILLI", "CREAM", "CRISPS", "CUCUMBER", "FLOUR", "FRUIT JUICE", "GARLIC", "GRAPES", "HONEY", "ICE CREAM", "LEMONADE", "LETTUCE", "NUTS", "PEACH", "PEAR", "PINEAPPLE", "SMOOTHIE", "TUNA", "YOGHURT", "PIZZA", "NOODLES", "CHEESEBURGER", "RICE", "BEANS", "CAKE", "POTATOES", "TOMATO", "MAYONNAISE", "SAUSAGES", "COMEDY", "DOCUMENTARY", "THRILLER", "ACTOR", "PRODUCER", "PERFORMER", "TARDIS", "AUDIENCE", "CHARACTER", "EPISODE", "SCREENS", "CIRCUS", "COSTUME", "LIGHTS", "MIME", "PUPPET", "STAGE", "CARAVAN", "CASTLE", "HUT", "SKYSCRAPER", "VILLA", "COTTAGE", "FLAT", "BADMINTON", "BASKETBALL", "DIVING", "GYMNASTICS", "HANDBALL", "ICE HOCKEY", "ICE-SKATING", "SURFING", "VOLLEYBALL", "YOGA", "CHANGING ROOMS", "FAN", "GOAL", "KIT", "MASCOT", "MATCH", "PITCH", "SCOREBOARD", "SEAT", "STADIUM", "TEAM", "TRAINERS", "TENNIS COURT", "TICKET", "TICKET OFFICE", "WHISTLE", "SLACKLINE", "BICYCLE", "AIRPORT", "STATION", "PLATFORM", "PASSPORT", "SLEEPING BAG", "SUN CREAM", "SUNGLASSES", "TENT", "TORCH", "SWIMSUIT", "HOTEL", "RECEPTION", "POOL", "GUEST", "FLOOR", "WIG", "MEDAL", "BARBECUE", "NEWSPAPER", "BOX", "BURGLAR", "PICKPOCKET", "ROBBER", "SHOPLIFTER", "THIEF", "VANDAL", "COURT", "LAWYER", "PRISON", "JAIL", "CLUE", "WITNESS", "FINGERPRINTS", "FOOTPRINTS", "HAND", "BERRY", "GARDEN", "LIBRARY", "CANTEEN", "DICTIONARY", "TEACHER", "HEAD TEACHER", "FORM TUTOR", "CLAY", "MOUSE", "CONCRETE", "WALL"
  ],
  B1_WIDER: [
    "ACCESSORY", "ANIMAL", "APRON", "ARTIST", "ASTRONAUT", "ASTRONOMER", "BALLOON", "BANDAGE", "BANK", "BARREL", "BASKET", "BEACH", "BICYCLE", "BILLBOARD", "BOOK", "BOTTLE", "BRACELET", "BUTTON", "CABLE", "CAKE", "CAMERA", "CAN", "CANVAS", "CAP", "CAPSULE", "CAR", "CHAIR", "CHEMIST", "CHOCOLATE", "CITY", "CLOTHES", "COLLAR", "COMET", "COMPUTER", "CONTAINER", "COSTUME", "COUNTRY", "DESIGNER", "DESSERT", "DICTIONARY", "DIPLOMA", "DOLL", "DRONE", "EARRING", "EARTH", "EXHIBITION", "FACTORY", "FERRY", "FILM", "FLAG", "FLOWER", "FLYER", "GADGET", "GALAXY", "GLASSES", "GLOVES", "GUITAR", "HAT", "HEADPHONES", "HELICOPTER", "HOOD", "HOODIE", "HOTEL", "HOUSE", "ICE", "INSTRUMENT", "KETTLE", "KILTS", "KIMONO", "KITCHEN", "LAPTOP", "LEGGINGS", "LIMO", "LOGO", "MAGAZINE", "MARATHON", "MARSHMALLOW", "MEDAL", "METEORITE", "MOON", "MURAL", "NECKLACE", "NEWSPAPER", "NOTEBOOK", "ONION", "ORB", "PAINTING", "PANCAKE", "PARACHUTE", "PHONE", "PLANET", "PLANETARIUM", "PLANT", "POCKET", "POSTER", "PULLOVER", "RAINCOAT", "RICKSHAW", "ROBOT", "RUFF", "SANDAL", "SATELLITE", "SCARF", "SCHOOL", "SCULPTURE", "SHOE", "SLEEVE", "SNAKE", "SOUP", "SPACECRAFT", "STATION", "STAR", "SUIT", "SUN", "TABLE", "TABLET", "TELESCOPE", "TICKET", "TIGHTS", "TIE", "TIN", "TOAST", "TOOL", "TOOTHPASTE", "TRACKSUIT", "TRAIN", "TRAINER", "TRIPOD", "TROUSERS", "TUXEDO", "UMBRELLA", "UNIFORM", "VEHICLE", "WELLIES", "WIG", "WING", "YACHT", "ZEPPELIN", "ZIP"
  ],
  B1_ADULTS: [
    "PHOTOGRAPH", "AIRPORT", "POCKET", "CAMERA", "SHOP", "DOCUMENT", "PASSPORT", "TICKET", "SUITCASE", "BAG", "PLANE", "TRAIN", "TAXI", "CAR", "BICYCLE", "MOTORBIKE", "TRICYCLE", "TYRE", "WHEEL", "RUBBER", "TRUCK", "BUS", "SHIP", "BOAT", "ENGINE", "BATTERY", "COMPUTER", "LAPTOP", "TABLET", "PHONE", "MOBILE", "MUSEUM", "EXHIBITION", "THEATRE", "GALLERY", "FILM", "MOVIE", "PHOTOGRAPHER", "ARTIST", "MUSICIAN", "SCIENTIST", "DOCTOR", "PROFESSOR", "MANAGER", "TEACHER", "STUDENT", "AUTHOR", "OFFICE", "RESTAURANT", "CAFE", "HOSPITAL", "SCHOOL", "UNIVERSITY", "FACTORY", "STREET", "VILLAGE", "CITY", "HOUSE", "HOME", "APARTMENT", "FLAT", "MANSION", "ROOM", "KITCHEN", "DOOR", "WINDOW", "TABLE", "CHAIR", "BED", "PEN", "PENCIL", "PAPER", "BOOK", "NEWSPAPER", "MAGAZINE", "PICTURE", "PAINTING", "CLOTHES", "SHIRT", "DRESS", "SKIRT", "SHOE", "BOOT", "SUNHAT", "FOOD", "MEAL", "CAKE", "SALAD", "BREAD", "FRUIT", "APPLE", "ORANGE", "POTATO", "ONION", "BROCCOLI", "MEAT", "FISH", "WATER", "COFFEE", "TEA", "PIZZA", "PASTA", "TAGLIATELLE", "TORTILLA", "NOODLES", "PRAWN", "CHILLI", "ANIMAL", "DOG", "CAT", "COW", "CROCODILE", "JELLYFISH", "BIRD", "SNAKE", "TREE"
  ],
  B2_C1: [
    "ACCESSORY", "ADDRESS", "AIRPORT", "ALBUM", "ANIMAL", "APARTMENT", "APPLE", "ARCHITECT", "ARM", "ARTIST", "AUTHOR", "BABY", "BACK", "BAG", "BALCONY", "BAND", "BANK", "BAR", "BASKETBALL", "BATH", "BEACH", "BEAN", "BEAR", "BEE", "BELT", "BENCH", "BICYCLE", "BIRD", "BOARD", "BOAT", "BODY", "BOOK", "BOTTLE", "BOX", "BOY", "BREAD", "BRICK", "BULL", "BUST", "CABLE", "CAFE", "CALENDAR", "CAMERA", "CANDY", "CANOE", "CAR", "CARPET", "CASE", "CAT", "CELEBRITY", "CELL", "CEMENT", "CERAMICS", "CHAIR", "CHANNEL", "CHEESE", "CHERRY", "CHESS", "CHICKEN", "CHILD", "CHOCOLATE", "CINEMA", "CIRCUS", "CITY", "CLOTHES", "CLOTHING", "CLOUD", "CLUB", "COFFEE", "COIN", "COMMUTER", "COMPANY", "COMPUTER", "CONTAINER", "COOK", "COPPER", "CORNER", "COTTAGE", "COUPLE", "COURT", "CRIMINAL", "CROWD", "CUP", "CUPBOARD", "CYCLIST", "DAM", "DANCE", "DENT", "DESK", "DESSERT", "DIAMOND", "DINER", "DINNER", "DISH", "DOCK", "DOCUMENTARY", "DOCUMENT", "DOOR", "DRESS", "DRINK", "DRIVER", "DRUG", "DVD", "EARTH", "EMAIL", "EMPLOYEE", "EMPLOYER", "ENGINEER", "ENTREPRENEUR", "EYE", "FACTORY", "FAN", "FIELD", "FILM", "FINANCIER", "FINGERPRINT", "FISH", "FLAT", "FLIP-FLOP", "FLOUR", "FLOWER", "FOOD", "FRAME", "FRIEND", "FRUIT", "FURNITURE", "GADGET", "GAME", "GARDEN", "GIFT", "GLACIER", "GLASS", "GOLD", "GRASS", "GROUP", "GUIDE", "GUITAR", "GYM", "HANDCUFFS", "HAT", "HEAD", "HEART", "HERO", "HOLIDAY", "HOME", "HORN", "HORSE", "HOSPITAL", "HOTEL", "HOUSE", "HUSBAND", "ICE", "INSECT", "INSTRUMENT", "JACKET", "JAM", "JEANS", "JEWELLERY", "JOURNEY", "JUDGE", "JUICE", "KAYAK", "KEY", "KID", "KING", "KITCHEN", "KNIFE", "LABORATORY", "LAKE", "LANDSCAPE", "LEAF", "LIBRARY", "LIGHT", "LINE", "MAGAZINE", "MAN", "MARKET", "MASTER", "MEAL", "MIRROR", "MOUNTAIN", "MOVIE", "MUSEUM", "MUSIC", "NECKLACE", "NEWSPAPER", "PACKET", "PAINT", "PAINTER", "PAINTING", "PAPER", "PARK", "PASSPORT", "PASTRY", "PEN", "PEOPLE", "PHILANTHROPIST", "PHONE", "PHOTOGRAPH", "PIANO", "PICTURE", "PIE", "PILE", "PILLOW", "PINE", "PINT", "PLANE", "PLATE", "PLATFORM", "PLAY", "PLINTH", "POLITICIAN", "PSYCHOLOGIST", "PUBLISHER", "PUPIL", "PYRAMID", "RADIO", "RAIL", "RAIN", "REFRIGERATOR", "RESTAURANT", "ROAD", "ROOM", "RUBBLE", "SALAD", "SAUNA", "SCHOOL", "SCIENTIST", "SCREENPLAY", "SCULPTURE", "SEA", "SHELF", "SHOP", "SKIRT", "SKY", "SLUM", "SMELL", "SNOW", "SONG", "SPONGE", "SPOON", "STAGE", "STAIR", "STAND", "STATUE", "STUDIO", "SUGAR", "SULTAN", "TABLE", "TART", "TEA", "TEACHER", "TEAM", "THEATRE", "TICKET", "TOOL", "TOY", "TRAIN", "TRAVELLER", "UNIVERSITY", "VEGETABLE", "VEHICLE", "VILLAGE", "WALL", "WAREHOUSE", "WATCH", "WATER", "WAVE", "WEAPON", "WIFE", "WINDOW", "WINE", "WOOD"
  ]
};

// ── SEGURIDAD: RATE LIMITING EN MEMORIA ──
// Máximo 10 peticiones por minuto por IP
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    rateLimitMap.set(ip, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  // Limpieza periódica si acumula demasiadas IPs
  if (rateLimitMap.size > 500) {
    for (const [key, list] of rateLimitMap.entries()) {
      const active = list.filter(t => now - t < windowMs);
      if (active.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, active);
    }
  }

  return true;
}

// ── SEGURIDAD: VALIDACIÓN DE ORIGEN / DOMINIO ──
function isAllowedOrigin(originHeader: string | undefined, refererHeader: string | undefined): boolean {
  const target = originHeader || refererHeader;
  if (!target) return true; // Peticiones directas del mismo servidor

  try {
    const parsed = new URL(target);
    const host = parsed.hostname.toLowerCase();

    // Dominio oficial de producción
    if (host === 'impostor-cil.vercel.app') return true;

    // Subdominios de preview en Vercel vinculados al proyecto
    if (host.endsWith('.vercel.app') && host.includes('impostor-cil')) return true;

    // Entornos de desarrollo local
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowed = isAllowedOrigin(req.headers.origin, req.headers.referer);

  // CORS dinámico seguro: solo responde al dominio autorizado
  if (allowed && origin) {
    try {
      const parsed = new URL(origin);
      res.setHeader('Access-Control-Allow-Origin', `${parsed.protocol}//${parsed.host}`);
    } catch {
      res.setHeader('Access-Control-Allow-Origin', 'https://impostor-cil.vercel.app');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://impostor-cil.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. BLOQUEO POR DOMINIO
  if (!allowed) {
    console.warn(`⛔ [Security] Blocked unauthorized domain request from: ${origin}`);
    return res.status(403).json({ error: 'Access denied: unauthorized domain.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. RATE LIMITING POR IP
  const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1')
    .toString()
    .split(',')[0]
    .trim();

  if (!checkRateLimit(clientIp, 10, 60000)) {
    console.warn(`⚠️ [Security] Rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait 1 minute before starting another game.' });
  }

  // 3. GENERACIÓN CON GEMINI
  try {
    const rawBody = req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});
    const { level, theme, useBookBank, usedWords = [] } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ Server Error: GEMINI_API_KEY is not configured');
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables' });
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
