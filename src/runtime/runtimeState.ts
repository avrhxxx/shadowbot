// =====================================
// 📁 src/runtime/runtimeState.ts
// =====================================

/**
 * 🧠 ROLE:
 * Zarządzanie stanem systemów (ON/OFF)
 *
 * INPUT:
 * - Google Sheets (system_flags)
 *
 * OUTPUT:
 * - czy system jest aktywny
 */

import { SheetRepository } from "@/integrations/google/googleSheetsRepository.js";
import { SYSTEM_FLAGS_SHEET } from "@/integrations/google/googleSheetsSchema.js";

import type { SystemName } from "./runtimeTypes";

// =====================================
// 🔹 TYPES
// =====================================

type SystemFlag = {
  id: string;
  system: string;
  enabled: string;
  reason?: string;
};

// =====================================
// 🔹 REPO
// =====================================

const repo = new SheetRepository<SystemFlag>(SYSTEM_FLAGS_SHEET);

// =====================================
// 🔹 CACHE
// =====================================

let cache: Map<string, boolean> = new Map();
let lastFetch = 0;

const TTL = 30_000;

// =====================================
// 🔄 REFRESH
// =====================================

async function refresh() {
  const data = await repo.findAll();

  cache = new Map(
    data.map((d) => [d.system, d.enabled === "true"])
  );

  lastFetch = Date.now();
}

// =====================================
// 🔍 ENSURE CACHE
// =====================================

async function ensure() {
  if (Date.now() - lastFetch > TTL) {
    await refresh();
  }
}

// =====================================
// 🔍 CHECK
// =====================================

export async function isSystemEnabled(
  system: SystemName
): Promise<boolean> {
  await ensure();

  const global = cache.get("global");
  const local = cache.get(system);

  if (global === false) return false;
  if (local === false) return false;

  return true;
}