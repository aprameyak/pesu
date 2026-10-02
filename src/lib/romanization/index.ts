export type RomanizationEntry = {
  canonical: string;
  tamilScript?: string;
  alternatives?: string[];
  notes?: string;
};

export function normalizeRomanized(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[.?!,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/zh/g, "l")
    .replace(/th/g, "t")
    .replace(/[^a-z0-9\s]/g, "");
}

export function softNormalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[.?!,;:]+$/g, "")
    .replace(/\s+/g, " ");
}

export function matchesRomanized(
  answer: string,
  accepted: string[],
  extraAlternatives: string[] = []
): boolean {
  const soft = softNormalize(answer);
  const softAccepted = [...accepted, ...extraAlternatives].map(softNormalize);
  if (softAccepted.includes(soft)) return true;

  const expanded = softAccepted.flatMap(expandCommonVariants);
  return expanded.includes(soft) || expanded.includes(normalizeRomanized(answer));
}

function expandCommonVariants(s: string): string[] {
  const variants = new Set<string>([s, normalizeRomanized(s)]);

  variants.add(s.replace(/a(?![aeiou])/g, "aa"));
  variants.add(s.replace(/aa/g, "a"));
  variants.add(s.replace(/i(?![aeiou])/g, "ee"));
  variants.add(s.replace(/ee/g, "i"));
  variants.add(s.replace(/u(?![aeiou])/g, "oo"));
  variants.add(s.replace(/oo/g, "u"));

  variants.add(s.replace(/th/g, "t"));
  variants.add(s.replace(/\bt(?![h])/g, "th"));
  variants.add(s.replace(/dh/g, "d"));

  variants.add(s.replace(/zh/g, "l"));
  variants.add(s.replace(/zh/g, "z"));

  variants.add(s.replace(/kku\b/g, "ku"));
  variants.add(s.replace(/kkuthu\b/g, "kuthu"));
  variants.add(s.replace(/kkuthu\b/g, "kkudhu"));

  variants.add(s.replace(/\?$/, ""));
  return [...variants];
}

export function displayRomanized(canonical: string): string {
  return canonical
    .split(" ")
    .map((w) => {
      if (!w) return w;

      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export const SPELLING_CONVENTIONS = {
  aspiratedDental: "th for த (thanni, pathu)",
  retroflexT: "t for ட when clear from context; teach distinction later",
  zhSound: "zh for ழ் (vazhi, pazham) — accept l as beginner variant",
  longVowels: "prefer single vowel for beginners (naan not naaan); aa allowed as alt",
  colloquialEndings: "prefer spoken -ra/-inga/-la over formal -kirathu forms",
  gemination: "double consonants when spoken (pasikkuthu, illa)",
} as const;

export const CORE_LEXICON: Record<string, RomanizationEntry> = {
  vanakkam: {
    canonical: "Vanakkam",
    tamilScript: "வணக்கம்",
    alternatives: ["vanakam", "vanakkam"],
  },
  aama: {
    canonical: "Aama",
    tamilScript: "ஆமா",
    alternatives: ["ama", "aam", "aamaa"],
    notes: "Spoken yes. Formal: aam / ஆம்",
  },
  illa: {
    canonical: "Illa",
    tamilScript: "இல்ல",
    alternatives: ["illaa", "illai"],
    notes: "Spoken no/not. Formal: illai / இல்லை",
  },
  nandri: {
    canonical: "Nandri",
    tamilScript: "நன்றி",
    alternatives: ["nanri", "nandri"],
  },
  please: {
    canonical: "Thayavu seidhu",
    tamilScript: "தயவு செய்து",
    alternatives: ["thayavu seithu", "dayavu seidhu"],
  },
  sari: {
    canonical: "Sari",
    tamilScript: "சரி",
    alternatives: ["okay", "ok"],
  },
  enna: {
    canonical: "Enna",
    tamilScript: "என்ன",
    alternatives: ["enna"],
  },
  yaar: {
    canonical: "Yaar",
    tamilScript: "யார்",
    alternatives: ["yar", "yaar"],
  },
  enga: {
    canonical: "Enga",
    tamilScript: "எங்க",
    alternatives: ["enge", "engey", "engae"],
    notes: "Spoken where. Formal: engē / எங்கே",
  },
  theriyathu: {
    canonical: "Theriyathu",
    tamilScript: "தெரியாது",
    alternatives: ["theriyathu", "theriyaathu", "theriyadu"],
  },
  puriyuthu: {
    canonical: "Puriyuthu",
    tamilScript: "புரியுது",
    alternatives: ["puriyuthu", "puriyudhu", "puriyum"],
    notes: "Spoken 'I understand'. Formal: purikirathu",
  },
  puriyala: {
    canonical: "Puriyala",
    tamilScript: "புரியல",
    alternatives: ["puriyala", "puriyaathu", "puriyavilla"],
  },
  enakku: {
    canonical: "Enakku",
    tamilScript: "எனக்கு",
    alternatives: ["enakku", "enakkuu", "enak"],
  },
  venum: {
    canonical: "Venum",
    tamilScript: "வேணும்",
    alternatives: ["venum", "venam", "vendum"],
    notes: "Spoken want. Formal: vendum / வேண்டும்",
  },
};
