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

// =====================================
// 🔹 AUTH / CLIENT
// =====================================
export * from "./googleSheetsClient.js";

// =====================================
// 🔹 STORAGE (LOW LEVEL)
// =====================================
export * from "./googleSheetsStorage.js";

// =====================================
// 🔹 DATA LAYER
// =====================================
export * from "./googleSheetsRepository.js";

// =====================================
// 🔹 SETUP / INIT
// =====================================
export * from "./googleSheetsSetup.js";

// =====================================
// 🔹 SCHEMA
// =====================================
export * from "./googleSheetsSchema.js";

// =====================================
// 🔹 OCR (VISION API)
// =====================================
export * from "./googleVisionService.js";