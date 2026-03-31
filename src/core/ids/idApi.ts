import { generateId } from "./idGenerator";
import { isIdOfType, getIdKey } from "./idValidator";
import { toDisplayWithPrefix } from "./idFormatter";
import type { IdKey } from "./idConfig";

// =====================================
// 🔹 API FACTORY
// =====================================

export function createIdApi<T extends string>(key: IdKey) {
  return {
    create(): T {
      return generateId(key) as T;
    },

    is(id: string): id is T {
      return isIdOfType(id, key);
    },

    parse(id: string): T | null {
      return isIdOfType(id, key) ? (id as T) : null;
    },

    display(id: string): string {
      return toDisplayWithPrefix(id, key);
    },

    getType(id: string) {
      return getIdKey(id);
    },
  };
}