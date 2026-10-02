import { hash } from "bcryptjs";
import { prisma } from "../src/lib/db";
import { isAdminEmail } from "../src/lib/auth";

type ExType =
  | "intro"
  | "pattern_intro"
  | "tamil_to_english"
  | "english_to_tamil"
  | "build_sentence"
  | "fill_blank"
  | "word_matching"
  | "conversation_response"
  | "listening_recognition"
  | "listening_meaning"
  | "find_mistake";

async function ensureConcept(key: string, kind: string, title: string, description?: string) {
  return prisma.concept.upsert({
    where: { key },
    create: { key, kind, title, description },
    update: { title, description, kind },
  });
}

async function linkLessonConcept(lessonId: string, conceptId: string) {
  await prisma.lessonConcept.upsert({
    where: { lessonId_conceptId: { lessonId, conceptId } },
    create: { lessonId, conceptId },
    update: {},
  });
}

function ex(
  order: number,
  type: ExType,
  data: {
    promptRomanized?: string;
    promptTamil?: string;
    promptEnglish?: string;
    promptText?: string;
    ttsText?: string;
    correctAnswers: string[];
    distractors?: string[];
    tokens?: string[];
    options?: string[];
    pairs?: { left: string; right: string }[];
    explanation?: string;
    hint?: string;
    literalMeaning?: string;
    formalNote?: string;
    conceptKeys: string[];
    metadata?: Record<string, unknown>;
  }
) {
  return {
    order,
    type,
    promptRomanized: data.promptRomanized ?? null,
    promptTamil: data.promptTamil ?? null,
    promptEnglish: data.promptEnglish ?? null,
    promptText: data.promptText ?? null,
    ttsText: data.ttsText ?? data.promptTamil ?? null,
    correctAnswers: JSON.stringify(data.correctAnswers),
    distractors: data.distractors ? JSON.stringify(data.distractors) : null,
    tokens: data.tokens ? JSON.stringify(data.tokens) : null,
    options: data.options ? JSON.stringify(data.options) : null,
    pairs: data.pairs ? JSON.stringify(data.pairs) : null,
    explanation: data.explanation ?? null,
    hint: data.hint ?? null,
    literalMeaning: data.literalMeaning ?? null,
    formalNote: data.formalNote ?? null,
    conceptKeys: JSON.stringify(data.conceptKeys),
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  };
}

async function main() {
  console.log("Seeding Pesu…");

  const achievements = [
    { key: "first_sentence", title: "First Tamil Sentence", description: "Complete your first lesson", icon: "sparkles", xpReward: 25 },
    { key: "first_conversation", title: "First Conversation", description: "Finish early Survival Tamil lessons", icon: "message", xpReward: 40 },
    { key: "words_50", title: "50 Words Learned", description: "Build a 50-word toolkit", icon: "book", xpReward: 50 },
    { key: "words_100", title: "100 Words Learned", description: "Hit 100 words", icon: "library", xpReward: 100 },
    { key: "perfect_lesson", title: "Perfect Lesson", description: "Complete a lesson with no mistakes", icon: "star", xpReward: 30 },
    { key: "streak_7", title: "7-Day Streak", description: "Learn seven days in a row", icon: "flame", xpReward: 50 },
    { key: "streak_30", title: "30-Day Streak", description: "A full month of consistency", icon: "flame", xpReward: 150 },
    { key: "listening_100", title: "100 Listening Exercises", description: "Train your ear", icon: "ear", xpReward: 75 },
  ];
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      create: a,
      update: a,
    });
  }

  const adminEmail = "admin@pesu.app";
  const adminHash = await hash("pesu-admin-123", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: "Admin",
      role: isAdminEmail(adminEmail) ? "admin" : "admin",
      onboardingDone: true,
      tamilLevel: "none",
    },
    update: {
      passwordHash: adminHash,
      role: "admin",
    },
  });

  const learnerHash = await hash("demo1234", 10);
  await prisma.user.upsert({
    where: { email: "demo@pesu.app" },
    create: {
      email: "demo@pesu.app",
      passwordHash: learnerHash,
      name: "Demo Learner",
      role: "learner",
      onboardingDone: false,
    },
    update: { passwordHash: learnerHash },
  });

  const course = await prisma.course.upsert({
    where: { slug: "spoken-tamil" },
    create: {
      slug: "spoken-tamil",
      title: "Spoken Tamil",
      description: "From zero to everyday conversational Tamil — Romanized first.",
      published: true,
      order: 0,
    },
    update: {
      title: "Spoken Tamil",
      description: "From zero to everyday conversational Tamil — Romanized first.",
    },
  });

  const unitDefs = [
    { slug: "survival", title: "Survival Tamil", description: "Greetings, yes/no, thanks, and the phrases you need on day one.", stage: 1, order: 0, published: true, status: "published" },
    { slug: "people", title: "People & Family", description: "I, you, he, she, we, they — and family words in real sentences.", stage: 2, order: 1, published: false, status: "draft" },
    { slug: "patterns", title: "Basic Sentence Patterns", description: "Reusable structures you can remix.", stage: 3, order: 2, published: false, status: "draft" },
    { slug: "questions", title: "Questions", description: "What, where, who, why, when, how — conversationally.", stage: 4, order: 3, published: false, status: "draft" },
    { slug: "food", title: "Food", description: "Hungry, thirsty, want, like, and mealtime talk.", stage: 5, order: 4, published: false, status: "draft" },
    { slug: "home", title: "Home & Family", description: "Household conversations heritage learners hear every day.", stage: 6, order: 5, published: false, status: "draft" },
    { slug: "daily", title: "Daily Life", description: "Work, school, going, coming, calling, sleeping.", stage: 7, order: 6, published: false, status: "draft" },
    { slug: "descriptions", title: "Descriptions", description: "Size, quality, colors, numbers, quantities.", stage: 8, order: 7, published: false, status: "draft" },
    { slug: "time", title: "Time", description: "Today, tomorrow, morning, later — scheduling talk.", stage: 9, order: 8, published: false, status: "draft" },
    { slug: "conversations", title: "Real Conversations", description: "Full exchanges you can understand and reconstruct.", stage: 10, order: 9, published: false, status: "draft" },
  ];

  const units = [];
  for (const u of unitDefs) {
    const unit = await prisma.unit.upsert({
      where: { courseId_slug: { courseId: course.id, slug: u.slug } },
      create: { ...u, courseId: course.id },
      update: {
        title: u.title,
        description: u.description,
        published: u.published,
        status: u.status,
        order: u.order,
        stage: u.stage,
      },
    });
    units.push(unit);
  }
  const survival = units[0];

  const vocabData = [
    { key: "vocab:vanakkam", romanized: "Vanakkam", tamil: "வணக்கம்", english: "Hello / greetings", pos: "phrase", category: "greetings" },
    { key: "vocab:aama", romanized: "Aama", tamil: "ஆமா", english: "Yes", pos: "particle", category: "basics", formal: "Aam", formalScript: "ஆம்", notes: "Spoken yes" },
    { key: "vocab:illa", romanized: "Illa", tamil: "இல்ல", english: "No / not", pos: "particle", category: "basics", formal: "Illai", formalScript: "இல்லை" },
    { key: "vocab:nandri", romanized: "Nandri", tamil: "நன்றி", english: "Thank you", pos: "phrase", category: "politeness" },
    { key: "vocab:sari", romanized: "Sari", tamil: "சரி", english: "Okay / alright", pos: "particle", category: "basics" },
    { key: "vocab:enna", romanized: "Enna", tamil: "என்ன", english: "What", pos: "question", category: "questions" },
    { key: "vocab:yaar", romanized: "Yaar", tamil: "யார்", english: "Who", pos: "question", category: "questions" },
    { key: "vocab:enga", romanized: "Enga", tamil: "எங்க", english: "Where", pos: "question", category: "questions", formal: "Engē", formalScript: "எங்கே" },
    { key: "vocab:theriyathu", romanized: "Theriyathu", tamil: "தெரியாது", english: "I don't know", pos: "phrase", category: "survival" },
    { key: "vocab:puriyuthu", romanized: "Puriyuthu", tamil: "புரியுது", english: "I understand", pos: "phrase", category: "survival", notes: "Spoken. Formal: purikirathu" },
    { key: "vocab:puriyala", romanized: "Puriyala", tamil: "புரியல", english: "I don't understand", pos: "phrase", category: "survival" },
    { key: "vocab:thayavu", romanized: "Thayavu seidhu", tamil: "தயவு செய்து", english: "Please", pos: "phrase", category: "politeness" },
  ] as const;

  for (const v of vocabData) {
    const concept = await ensureConcept(v.key, "vocabulary", v.romanized, v.english);
    await prisma.vocabularyItem.upsert({
      where: { conceptId: concept.id },
      create: {
        conceptId: concept.id,
        romanized: v.romanized,
        tamilScript: v.tamil,
        english: v.english,
        partOfSpeech: v.pos,
        category: v.category,
        ttsText: v.tamil,
        formalEquivalent: "formal" in v ? (v as { formal?: string }).formal : null,
        formalScript: "formalScript" in v ? (v as { formalScript?: string }).formalScript : null,
        notes: "notes" in v ? (v as { notes?: string }).notes : null,
        status: "published",
        difficulty: 1,
        tags: JSON.stringify([v.category, "unit1"]),
        commonVariants: JSON.stringify([v.romanized.toLowerCase()]),
        lessonIntroduced: "survival-greetings",
      },
      update: {
        romanized: v.romanized,
        tamilScript: v.tamil,
        english: v.english,
        status: "published",
      },
    });
  }

  await ensureConcept("pattern:survival-basics", "pattern", "Survival basics", "Core yes/no and politeness");
  await ensureConcept("phrase:enna", "phrase", "Asking what", "Using enna");
  await ensureConcept("dialogue:first-exchange", "dialogue_skill", "First exchange", "Simple greeting exchange");

  const existingLessons = await prisma.lesson.findMany({ where: { unitId: survival.id } });
  for (const l of existingLessons) {
    await prisma.exercise.deleteMany({ where: { lessonId: l.id } });
    await prisma.lessonConcept.deleteMany({ where: { lessonId: l.id } });
  }

  const lesson1 = await prisma.lesson.upsert({
    where: { unitId_slug: { unitId: survival.id, slug: "greetings" } },
    create: {
      unitId: survival.id,
      slug: "greetings",
      title: "Vanakkam",
      description: "Say hello the Tamil way.",
      order: 0,
      xpReward: 20,
      estimatedMin: 4,
      status: "published",
      published: true,
    },
    update: {
      title: "Vanakkam",
      description: "Say hello the Tamil way.",
      published: true,
      status: "published",
    },
  });

  const cVanakkam = await prisma.concept.findUniqueOrThrow({ where: { key: "vocab:vanakkam" } });
  const cNandri = await prisma.concept.findUniqueOrThrow({ where: { key: "vocab:nandri" } });
  await linkLessonConcept(lesson1.id, cVanakkam.id);
  await linkLessonConcept(lesson1.id, cNandri.id);

  const lesson1Exercises = [
    ex(0, "intro", {
      promptRomanized: "Vanakkam",
      promptTamil: "வணக்கம்",
      promptEnglish: "Hello / greetings",
      promptText: "This is the everyday Tamil hello. Tap the speaker to hear it.",
      ttsText: "வணக்கம்",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:vanakkam"],
    }),
    ex(1, "tamil_to_english", {
      promptRomanized: "Vanakkam",
      promptTamil: "வணக்கம்",
      ttsText: "வணக்கம்",
      promptText: "What does this mean?",
      correctAnswers: ["Hello", "Hello / greetings", "Hi", "Greetings"],
      options: ["Hello", "Thank you", "Where?", "Okay"],
      conceptKeys: ["vocab:vanakkam"],
    }),
    ex(2, "english_to_tamil", {
      promptEnglish: "Hello",
      promptText: "How do you say this in Tamil?",
      correctAnswers: ["Vanakkam"],
      options: ["Vanakkam", "Nandri", "Sari", "Illa"],
      conceptKeys: ["vocab:vanakkam"],
    }),
    ex(3, "intro", {
      promptRomanized: "Nandri",
      promptTamil: "நன்றி",
      promptEnglish: "Thank you",
      promptText: "You'll hear this constantly. Pair it with a smile.",
      ttsText: "நன்றி",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:nandri"],
    }),
    ex(4, "word_matching", {
      promptText: "Match the Tamil with English",
      pairs: [
        { left: "Vanakkam", right: "Hello" },
        { left: "Nandri", right: "Thank you" },
      ],
      correctAnswers: ["matched"],
      conceptKeys: ["vocab:vanakkam", "vocab:nandri"],
    }),
    ex(5, "listening_recognition", {
      promptTamil: "வணக்கம்",
      ttsText: "வணக்கம்",
      promptText: "What did you hear?",
      correctAnswers: ["Vanakkam"],
      options: ["Vanakkam", "Nandri", "Sari", "Enna"],
      conceptKeys: ["vocab:vanakkam"],
    }),
    ex(6, "listening_meaning", {
      promptTamil: "நன்றி",
      ttsText: "நன்றி",
      promptText: "What does the speaker mean?",
      correctAnswers: ["Thank you"],
      options: ["Thank you", "Hello", "Yes", "I don't know"],
      conceptKeys: ["vocab:nandri"],
    }),
  ];

  for (const e of lesson1Exercises) {
    await prisma.exercise.create({ data: { ...e, lessonId: lesson1.id } });
  }

  const lesson2 = await prisma.lesson.upsert({
    where: { unitId_slug: { unitId: survival.id, slug: "yes-no" } },
    create: {
      unitId: survival.id,
      slug: "yes-no",
      title: "Aama & Illa",
      description: "Yes, no, and okay — the backbone of replies.",
      order: 1,
      xpReward: 20,
      estimatedMin: 5,
      status: "published",
      published: true,
    },
    update: { published: true, status: "published", title: "Aama & Illa" },
  });

  for (const key of ["vocab:aama", "vocab:illa", "vocab:sari", "pattern:survival-basics"]) {
    const c = await prisma.concept.findUniqueOrThrow({ where: { key } });
    await linkLessonConcept(lesson2.id, c.id);
  }

  const lesson2Exercises = [
    ex(0, "intro", {
      promptRomanized: "Aama",
      promptTamil: "ஆமா",
      promptEnglish: "Yes",
      promptText: "This is the natural spoken 'yes'. You'll hear it far more than formal āam.",
      ttsText: "ஆமா",
      formalNote: "Formal / written: Aam (ஆம்)",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:aama"],
    }),
    ex(1, "intro", {
      promptRomanized: "Illa",
      promptTamil: "இல்ல",
      promptEnglish: "No / not",
      promptText: "Spoken Tamil shortens illai to illa. Use this in conversation.",
      ttsText: "இல்ல",
      formalNote: "Formal / written: Illai (இல்லை)",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:illa"],
    }),
    ex(2, "tamil_to_english", {
      promptRomanized: "Aama",
      promptTamil: "ஆமா",
      ttsText: "ஆமா",
      correctAnswers: ["Yes"],
      options: ["Yes", "No", "Okay", "What?"],
      conceptKeys: ["vocab:aama"],
    }),
    ex(3, "tamil_to_english", {
      promptRomanized: "Illa",
      promptTamil: "இல்ல",
      ttsText: "இல்ல",
      correctAnswers: ["No", "No / not", "Not"],
      options: ["Yes", "No", "Thank you", "Please"],
      conceptKeys: ["vocab:illa"],
    }),
    ex(4, "english_to_tamil", {
      promptEnglish: "Okay",
      correctAnswers: ["Sari"],
      options: ["Sari", "Aama", "Nandri", "Enna"],
      conceptKeys: ["vocab:sari"],
    }),
    ex(5, "conversation_response", {
      promptRomanized: "Vanakkam!",
      promptTamil: "வணக்கம்!",
      promptEnglish: "Hello!",
      promptText: "Someone greets you. What's a natural reply?",
      ttsText: "வணக்கம்",
      correctAnswers: ["Vanakkam"],
      options: ["Vanakkam", "Theriyathu", "Puriyala", "Enna"],
      explanation: "Greeting back with Vanakkam is the natural move.",
      conceptKeys: ["vocab:vanakkam", "dialogue:first-exchange"],
    }),
    ex(6, "fill_blank", {
      promptRomanized: "___ — yes in spoken Tamil",
      promptText: "Fill in the blank",
      correctAnswers: ["Aama"],
      options: ["Aama", "Illa", "Enga", "Yaar"],
      conceptKeys: ["vocab:aama"],
    }),
    ex(7, "listening_recognition", {
      promptTamil: "சரி",
      ttsText: "சரி",
      promptText: "What did you hear?",
      correctAnswers: ["Sari"],
      options: ["Sari", "Aama", "Illa", "Nandri"],
      conceptKeys: ["vocab:sari"],
    }),
    ex(8, "find_mistake", {
      promptRomanized: "Illai",
      promptTamil: "இல்லை",
      promptEnglish: "No (formal written form shown as everyday speech)",
      promptText: "For casual conversation, which form fits better?",
      correctAnswers: ["Illa"],
      options: ["Illa", "Illai is fine everywhere", "Aama", "Sari"],
      explanation: "Illai is correct formally, but Illa is what people usually say.",
      formalNote: "Written: Illai · Spoken: Illa",
      conceptKeys: ["vocab:illa"],
    }),
  ];
  for (const e of lesson2Exercises) {
    await prisma.exercise.create({ data: { ...e, lessonId: lesson2.id } });
  }

  const lesson3 = await prisma.lesson.upsert({
    where: { unitId_slug: { unitId: survival.id, slug: "please-polite" } },
    create: {
      unitId: survival.id,
      slug: "please-polite",
      title: "Please & polite basics",
      description: "Thayavu seidhu and putting politeness together.",
      order: 2,
      xpReward: 20,
      estimatedMin: 4,
      status: "published",
      published: true,
    },
    update: { published: true, status: "published" },
  });

  for (const key of ["vocab:thayavu", "vocab:nandri", "vocab:sari"]) {
    const c = await prisma.concept.findUniqueOrThrow({ where: { key } });
    await linkLessonConcept(lesson3.id, c.id);
  }

  const lesson3Exercises = [
    ex(0, "intro", {
      promptRomanized: "Thayavu seidhu",
      promptTamil: "தயவு செய்து",
      promptEnglish: "Please",
      promptText: "A polite please. In casual family talk, intonation often does more work than this phrase — but it's useful.",
      ttsText: "தயவு செய்து",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:thayavu"],
    }),
    ex(1, "build_sentence", {
      promptEnglish: "Please",
      promptText: "Build the phrase",
      tokens: ["Thayavu", "seidhu", "Nandri", "Sari"],
      correctAnswers: ["Thayavu seidhu"],
      conceptKeys: ["vocab:thayavu"],
    }),
    ex(2, "english_to_tamil", {
      promptEnglish: "Thank you",
      correctAnswers: ["Nandri"],
      options: ["Nandri", "Vanakkam", "Aama", "Enga"],
      conceptKeys: ["vocab:nandri"],
    }),
    ex(3, "word_matching", {
      promptText: "Match them",
      pairs: [
        { left: "Nandri", right: "Thank you" },
        { left: "Thayavu seidhu", right: "Please" },
        { left: "Sari", right: "Okay" },
      ],
      correctAnswers: ["matched"],
      conceptKeys: ["vocab:nandri", "vocab:thayavu", "vocab:sari"],
    }),
    ex(4, "conversation_response", {
      promptRomanized: "Nandri!",
      promptTamil: "நன்றி!",
      promptEnglish: "Thank you!",
      promptText: "Someone thanks you. A natural reply:",
      ttsText: "நன்றி",
      correctAnswers: ["Sari"],
      options: ["Sari", "Theriyathu", "Puriyala", "Yaar"],
      explanation: "Sari works like 'sure / you're welcome / okay' in this moment.",
      conceptKeys: ["vocab:sari", "vocab:nandri"],
    }),
  ];
  for (const e of lesson3Exercises) {
    await prisma.exercise.create({ data: { ...e, lessonId: lesson3.id } });
  }

  const lesson4 = await prisma.lesson.upsert({
    where: { unitId_slug: { unitId: survival.id, slug: "what-who-where" } },
    create: {
      unitId: survival.id,
      slug: "what-who-where",
      title: "Enna, Yaar, Enga",
      description: "What? Who? Where? — your first question toolkit.",
      order: 3,
      xpReward: 25,
      estimatedMin: 6,
      status: "published",
      published: true,
    },
    update: { published: true, status: "published" },
  });

  for (const key of ["vocab:enna", "vocab:yaar", "vocab:enga", "phrase:enna"]) {
    const c = await prisma.concept.findUniqueOrThrow({ where: { key } });
    await linkLessonConcept(lesson4.id, c.id);
  }

  const lesson4Exercises = [
    ex(0, "pattern_intro", {
      promptRomanized: "Enna?",
      promptTamil: "என்ன?",
      promptEnglish: "What?",
      promptText: "One of the most useful words in Tamil. Alone it means 'what?' — and it builds countless questions.",
      ttsText: "என்ன",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:enna"],
    }),
    ex(1, "intro", {
      promptRomanized: "Yaar?",
      promptTamil: "யார்?",
      promptEnglish: "Who?",
      ttsText: "யார்",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:yaar"],
    }),
    ex(2, "intro", {
      promptRomanized: "Enga?",
      promptTamil: "எங்க?",
      promptEnglish: "Where?",
      promptText: "Spoken Tamil often drops the long ending. Formal writing uses engē.",
      ttsText: "எங்க",
      formalNote: "Formal: Engē (எங்கே)",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:enga"],
    }),
    ex(3, "word_matching", {
      promptText: "Match the question words",
      pairs: [
        { left: "Enna", right: "What" },
        { left: "Yaar", right: "Who" },
        { left: "Enga", right: "Where" },
      ],
      correctAnswers: ["matched"],
      conceptKeys: ["vocab:enna", "vocab:yaar", "vocab:enga"],
    }),
    ex(4, "tamil_to_english", {
      promptRomanized: "Enga?",
      promptTamil: "எங்க?",
      ttsText: "எங்க",
      correctAnswers: ["Where", "Where?"],
      options: ["Where", "What", "Who", "Why"],
      conceptKeys: ["vocab:enga"],
    }),
    ex(5, "english_to_tamil", {
      promptEnglish: "Who?",
      correctAnswers: ["Yaar", "Yaar?"],
      options: ["Yaar", "Enna", "Enga", "Sari"],
      conceptKeys: ["vocab:yaar"],
    }),
    ex(6, "listening_recognition", {
      promptTamil: "என்ன",
      ttsText: "என்ன",
      promptText: "What did you hear?",
      correctAnswers: ["Enna", "Enna?"],
      options: ["Enna", "Enga", "Yaar", "Aama"],
      conceptKeys: ["vocab:enna"],
    }),
    ex(7, "conversation_response", {
      promptRomanized: "Enga?",
      promptTamil: "எங்க?",
      promptEnglish: "Where?",
      promptText: "Someone asks where something is — you don't know. Reply:",
      ttsText: "எங்க",
      correctAnswers: ["Theriyathu"],
      options: ["Theriyathu", "Vanakkam", "Nandri", "Aama"],
      conceptKeys: ["vocab:theriyathu", "vocab:enga"],
    }),
  ];
  for (const e of lesson4Exercises) {
    await prisma.exercise.create({ data: { ...e, lessonId: lesson4.id } });
  }

  const lesson5 = await prisma.lesson.upsert({
    where: { unitId_slug: { unitId: survival.id, slug: "understand" } },
    create: {
      unitId: survival.id,
      slug: "understand",
      title: "I get it / I don't",
      description: "Theriyathu, puriyuthu, puriyala — survival comprehension phrases.",
      order: 4,
      xpReward: 25,
      estimatedMin: 6,
      status: "published",
      published: true,
    },
    update: { published: true, status: "published" },
  });

  for (const key of ["vocab:theriyathu", "vocab:puriyuthu", "vocab:puriyala", "dialogue:first-exchange"]) {
    const c = await prisma.concept.findUniqueOrThrow({ where: { key } });
    await linkLessonConcept(lesson5.id, c.id);
  }

  const dialogue = await prisma.dialogue.upsert({
    where: { slug: "survival-do-you-understand" },
    create: {
      slug: "survival-do-you-understand",
      title: "Do you understand?",
      scenario: "A relative is explaining something and checks in with you.",
      participants: JSON.stringify(["Relative", "You"]),
      difficulty: 1,
      status: "published",
      conceptKeys: JSON.stringify(["vocab:puriyuthu", "vocab:puriyala", "vocab:theriyathu"]),
    },
    update: { status: "published" },
  });

  await prisma.dialogueLine.deleteMany({ where: { dialogueId: dialogue.id } });
  const lines = [
    { order: 0, speaker: "Relative", romanizedTamil: "Puriyutha?", tamilScript: "புரியுதா?", english: "Do you understand?", ttsText: "புரியுதா" },
    { order: 1, speaker: "You", romanizedTamil: "Puriyala.", tamilScript: "புரியல.", english: "I don't understand.", ttsText: "புரியல" },
    { order: 2, speaker: "Relative", romanizedTamil: "Sari, sari.", tamilScript: "சரி, சரி.", english: "Okay, okay.", ttsText: "சரி சரி" },
  ];
  for (const line of lines) {
    await prisma.dialogueLine.create({ data: { ...line, dialogueId: dialogue.id } });
  }

  const lesson5Exercises = [
    ex(0, "intro", {
      promptRomanized: "Theriyathu",
      promptTamil: "தெரியாது",
      promptEnglish: "I don't know",
      promptText: "Essential when you're lost mid-conversation. No shame — use it.",
      ttsText: "தெரியாது",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:theriyathu"],
    }),
    ex(1, "intro", {
      promptRomanized: "Puriyuthu",
      promptTamil: "புரியுது",
      promptEnglish: "I understand",
      ttsText: "புரியுது",
      formalNote: "Formal: Purikirathu",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:puriyuthu"],
    }),
    ex(2, "intro", {
      promptRomanized: "Puriyala",
      promptTamil: "புரியல",
      promptEnglish: "I don't understand",
      promptText: "Heritage learners: this unlocks asking people to switch or slow down.",
      ttsText: "புரியல",
      correctAnswers: ["continue"],
      conceptKeys: ["vocab:puriyala"],
    }),
    ex(3, "tamil_to_english", {
      promptRomanized: "Puriyala",
      promptTamil: "புரியல",
      ttsText: "புரியல",
      correctAnswers: ["I don't understand"],
      options: ["I don't understand", "I understand", "I don't know", "Okay"],
      conceptKeys: ["vocab:puriyala"],
    }),
    ex(4, "english_to_tamil", {
      promptEnglish: "I don't know",
      correctAnswers: ["Theriyathu"],
      options: ["Theriyathu", "Puriyuthu", "Puriyala", "Sari"],
      conceptKeys: ["vocab:theriyathu"],
    }),
    ex(5, "conversation_response", {
      promptRomanized: "Puriyutha?",
      promptTamil: "புரியுதா?",
      promptEnglish: "Do you understand?",
      promptText: "You didn't catch it. Reply:",
      ttsText: "புரியுதா",
      correctAnswers: ["Puriyala"],
      options: ["Puriyala", "Vanakkam", "Nandri", "Yaar"],
      conceptKeys: ["vocab:puriyala"],
    }),
    ex(6, "build_sentence", {
      promptEnglish: "I understand",
      promptText: "Build the reply",
      tokens: ["Puriyuthu", "Puriyala", "Theriyathu"],
      correctAnswers: ["Puriyuthu"],
      conceptKeys: ["vocab:puriyuthu"],
    }),
    ex(7, "listening_meaning", {
      promptTamil: "தெரியாது",
      ttsText: "தெரியாது",
      promptText: "What does the speaker mean?",
      correctAnswers: ["I don't know"],
      options: ["I don't know", "I understand", "Thank you", "Where?"],
      conceptKeys: ["vocab:theriyathu"],
    }),
    ex(8, "word_matching", {
      promptText: "Lock these in",
      pairs: [
        { left: "Theriyathu", right: "I don't know" },
        { left: "Puriyuthu", right: "I understand" },
        { left: "Puriyala", right: "I don't understand" },
      ],
      correctAnswers: ["matched"],
      conceptKeys: ["vocab:theriyathu", "vocab:puriyuthu", "vocab:puriyala"],
    }),
  ];
  for (const e of lesson5Exercises) {
    await prisma.exercise.create({ data: { ...e, lessonId: lesson5.id } });
  }

  const sentenceSamples = [
    { romanizedTamil: "Vanakkam", tamilScript: "வணக்கம்", english: "Hello", ttsText: "வணக்கம்", conceptKey: "vocab:vanakkam" },
    { romanizedTamil: "Nandri", tamilScript: "நன்றி", english: "Thank you", ttsText: "நன்றி", conceptKey: "vocab:nandri" },
    { romanizedTamil: "Enna?", tamilScript: "என்ன?", english: "What?", ttsText: "என்ன", conceptKey: "vocab:enna" },
    { romanizedTamil: "Puriyala", tamilScript: "புரியல", english: "I don't understand", ttsText: "புரியல", conceptKey: "vocab:puriyala" },
  ];
  for (const s of sentenceSamples) {
    const concept = await prisma.concept.findUnique({ where: { key: s.conceptKey } });
    const existing = await prisma.sentence.findFirst({
      where: { romanizedTamil: s.romanizedTamil, english: s.english },
    });
    if (!existing) {
      await prisma.sentence.create({
        data: {
          romanizedTamil: s.romanizedTamil,
          tamilScript: s.tamilScript,
          english: s.english,
          naturalMeaning: s.english,
          ttsText: s.ttsText,
          conceptId: concept?.id,
          status: "published",
          register: "colloquial",
        },
      });
    }
  }

  const demo = await prisma.user.findUnique({ where: { email: "demo@pesu.app" } });
  if (demo) {
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: demo.id, lessonId: lesson1.id } },
      create: { userId: demo.id, lessonId: lesson1.id, status: "available" },
      update: { status: "available" },
    });
  }

  console.log("Seed complete.");
  console.log("Admin: admin@pesu.app / pesu-admin-123");
  console.log("Demo:  demo@pesu.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
