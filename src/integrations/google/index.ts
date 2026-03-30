// =====================================
// 📁 src/integrations/google/index.ts
// =====================================

/**
 * 🚪 PUBLIC API – Google integration layer
 *
 * ❗ RULES:
 * - ONLY exports
 * - NO logic
 */

// 🔹 CORE
export * from "./googleSheetsClient";

// 🔹 STORAGE (low-level)
export * from "./googleSheetsStorage";

// 🔹 SETUP (init / self-healing)
export * from "./googleSheetsSetup";

// 🔹 SCHEMA (tabs)
export * from "./googleSheetsSchema";

// 🔹 REPOSITORY
export * from "./SheetRepository";

// 🔹 OCR
export * from "./GoogleVisionService";