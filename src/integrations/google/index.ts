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
export * from "./googleSheetsClient";

// =====================================
// 🔹 DATA LAYER
// =====================================
export * from "./googleSheetsRepository";

// =====================================
// 🔹 SETUP / INIT
// =====================================
export * from "./googleSheetsSetup";

// =====================================
// 🔹 SCHEMA
// =====================================
export * from "./googleSheetsSchema";

// =====================================
// 🔹 OCR (VISION API)
// =====================================
export * from "./GoogleVisionService";