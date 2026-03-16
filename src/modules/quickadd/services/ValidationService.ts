// src/modules/quickadd/services/ValidationService.ts

import { QuickAddEntry } from "../types/QuickAddEntry";
import { normalizeNickname } from "../utils/nicknameNormalizer";
import { parseNumber } from "../utils/numberParser";

export class ValidationService {
  // Waliduje pojedynczy wpis QuickAdd
  public static validateEntry(entry: QuickAddEntry): QuickAddEntry {
    const validated = { ...entry };

    // Normalizacja nicka
    validated.nickname = normalizeNickname(validated.nickname);

    // Parsowanie wartości liczbowej
    try {
      parseNumber(validated.value);
      validated.status = "OK";
    } catch {
      validated.status = "INVALID";
    }

    // Prosta walidacja długości nicka
    if (validated.nickname.length < 2 || validated.nickname.length > 24) {
      validated.status = "INVALID";
    }

    return validated;
  }

  // Walidacja całego bufora podglądu
  public static validateBuffer(entries: QuickAddEntry[]): QuickAddEntry[] {
    return entries.map(this.validateEntry);
  }
}