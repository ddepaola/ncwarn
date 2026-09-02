import { randomBytes } from "node:crypto";

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // no 0/1/l/o/i — unambiguous

/** Opaque public identifier (handoff §11.3: never expose sequential DB ids). */
export function publicId(prefix: string, length = 14): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}_${out}`;
}
