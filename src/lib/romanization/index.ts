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
