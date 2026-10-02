import { createHash } from "crypto";

export function hashText(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}
