// =====================================
// 📁 src/core/ids/ids.ts
// =====================================

import { customAlphabet } from "nanoid";
import {
  ID_LENGTH,
  DISPLAY_ID_LENGTH,
  ID_PREFIX_MAP,
  PREFIX_TO_KEY_MAP,
  type IdKey,
} from "./idConfig.js";

import type { IdTypeMap } from "./idTypes.js";

// =====================================
// 🔹 INTERNALS
// =====================================

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const nano = customAlphabet(ALPHABET, ID_LENGTH);

function generate(prefix: string): string {
  return `${prefix}-${nano()}`;
}

function isValid(id: string): boolean {
  const prefixes = Object.values(ID_PREFIX_MAP).join("");
  const regex = new RegExp(`^[${prefixes}]-[a-z0-9]{${ID_LENGTH}}$`);
  return regex.test(id);
}

function getType(id: string): IdKey | null {
  if (!isValid(id)) return null;
  return PREFIX_TO_KEY_MAP[id[0] as keyof typeof PREFIX_TO_KEY_MAP] ?? null;
}

function extractSuffix(id: string): string | null {
  return id.split("-")[1] ?? null;
}

function toDisplay(id: string, length = DISPLAY_ID_LENGTH): string {
  const suffix = extractSuffix(id);
  if (!suffix) return id;
  return suffix.slice(0, Math.min(length, suffix.length));
}

// =====================================
// 🔹 FACTORY BUILDER
// =====================================

function createIdApi<K extends IdKey>(key: K) {
  const prefix = ID_PREFIX_MAP[key];

  return {
    create(): IdTypeMap[K] {
      const id = generate(prefix);

      if (!isValid(id)) {
        throw new Error(`Invalid ${key} id generated`);
      }

      return id as IdTypeMap[K];
    },

    is(id: string): id is IdTypeMap[K] {
      return isValid(id) && getType(id) === key;
    },

    parse(id: string): IdTypeMap[K] {
      if (!this.is(id)) {
        throw new Error(`Invalid ${key} id`);
      }
      return id as IdTypeMap[K];
    },

    display(id: IdTypeMap[K], length?: number): string {
      return `${prefix}-${toDisplay(id, length)}`;
    },
  };
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export const ids = {
  trace: createIdApi("trace"),
  session: createIdApi("session"),
  queue: createIdApi("queue"),
  job: createIdApi("job"),
  interaction: createIdApi("interaction"),
  external: createIdApi("external"),
  correlation: createIdApi("correlation"),
  flow: createIdApi("flow"),
  runtime: createIdApi("runtime"),
} as const;