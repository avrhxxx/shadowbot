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
// 🔹 CORE API (LOW LEVEL)
// =====================================
export * from "./googleSheets.js";

// =====================================
// 🔹 DATA LAYER
// =====================================
export * from "./googleRepository.js";

// =====================================
// 🔹 SETUP / INIT
// =====================================
export * from "./googleSetup.js";

// =====================================
// 🔹 SCHEMA
// =====================================
export * from "./googleSchema.js";

// =====================================
// 🔹 OCR (VISION API)
// =====================================
export * from "./googleVision.js";