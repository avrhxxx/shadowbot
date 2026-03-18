import { unicodeCleaner } from "./unicodeCleaner";

export function normalizeNickname(nick: string): string {
  let cleaned = unicodeCleaner(nick);
  cleaned = cleaned.toLowerCase();
  cleaned = cleaned.replace(/\s+/g, " "); // collapse spaces
  return cleaned;
}