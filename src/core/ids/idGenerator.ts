import { customAlphabet } from "nanoid";
import { ID_LENGTH, ID_PREFIX_MAP, IdKey } from "./idConfig";

// =====================================
// 🔹 ALPHABET
// =====================================

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  ID_LENGTH
);

// =====================================
// 🔹 GENERATOR
// =====================================

export function generateId(key: IdKey): string {
  const prefix = ID_PREFIX_MAP[key];
  return `${prefix}_${nanoid()}`;
}