// =====================================
// 📁 src/integrations/google/index.ts
// =====================================

/**
 * 🚪 ROLE:
 * Public API entry point for Google integrations.
 *
 * This file:
 * - exposes ONLY what external systems should use
 * - hides internal implementation details
 *
 * ❗ RULES:
 * - NO logic here
 * - ONLY exports
 */

// =====================================
// 🔹 SHEETS
// =====================================

export * from "./googleSheetsClient";
export * from "./googleSheetsStorage";
export * from "./SheetRepository";

// =====================================
// 🔹 OCR (VISION API)
// =====================================

export * from "./GoogleVisionService";