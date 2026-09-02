import { existsSync } from "node:fs";
import path from "node:path";

/** Static images live in /public/images and are optional: a missing file simply hides the slot. */
export function publicImage(name: string): string | null {
  return existsSync(path.join(process.cwd(), "public", "images", name)) ? `/images/${name}` : null;
}
