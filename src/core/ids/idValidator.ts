import {
  ID_PREFIX_MAP,
  PREFIX_TO_KEY_MAP,
  IdKey,
} from "./idConfig";

// =====================================
// 🔹 REGEX (cached)
// =====================================

const PREFIXES = Object.values(ID_PREFIX_MAP).join("|");

const ID_REGEX = new RegExp(
  `^(${PREFIXES})_[a-z0-9]{8}$`
);

// =====================================
// 🔹 VALIDATION
// =====================================

export function isValidId(id: string): boolean {
  return ID_REGEX.test(id);
}

// =====================================
// 🔹 TYPE RESOLUTION
// =====================================

export function getIdKey(id: string): IdKey | null {
  if (!isValidId(id)) return null;

  const [prefix] = id.split("_");

  return PREFIX_TO_KEY_MAP[prefix] ?? null;
}

// =====================================
// 🔹 TYPE GUARDS
// =====================================

export function isIdOfType(id: string, key: IdKey): boolean {
  return getIdKey(id) === key;
}