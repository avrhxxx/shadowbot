// =====================================
// 📁 src/quickadd/core/QuickAddTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central contract definitions for the entire QuickAdd system.
 *
 * This file defines:
 * - supported QuickAdd types (feature-level routing)
 * - shared data structures between OCR → parsing → validation → storage
 *
 * ❗ RULES:
 * - NO logic here
 * - ONLY types / interfaces / enums
 * - must stay lightweight and dependency-free
 */

// =====================================
// 🔹 QUICK ADD TYPES (ENTRY MODES)
// =====================================

export type QuickAddType =
  | "DONATIONS_POINTS"
  | "DUEL_POINTS"
  | "RR_SIGNUPS"
  | "RR_RESULTS";

// =====================================
// 🔹 PARSED ENTRY (RAW OUTPUT FROM PARSER)
// =====================================

export type ParsedEntry = {
  nickname: string;
  value: number;
};

// =====================================
// 🔹 VALIDATED ENTRY (AFTER VALIDATION)
// =====================================

export type EntryStatus =
  | "OK"
  | "LOW_CONFIDENCE"
  | "UNRESOLVED"
  | "DUPLICATE"
  | "INVALID_VALUE";

export type ValidatedEntry = {
  id: number;

  nickname: string;
  value: number;

  originalNickname: string;

  status: EntryStatus;
  confidence: number;

  suggestion?: string;
};

// =====================================
// 🔹 PIPELINE RESULT
// =====================================

export type PipelineResult = {
  entries: ValidatedEntry[];
};

// =====================================
// 🔹 SESSION STAGE
// =====================================

export type QuickAddStage =
  | "COLLECTING"
  | "CONFIRM_PENDING";