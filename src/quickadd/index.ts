// =====================================
// 📁 src/quickadd/index.ts
// =====================================

/**
 * 🚪 ROLE:
 * Public API entry point for the QuickAdd module.
 *
 * This file:
 * - exposes ONLY what external systems should use
 * - hides internal structure (clean boundaries)
 *
 * ❗ RULES:
 * - NO logic here
 * - ONLY exports
 * - safe refactor point (internal changes won't break imports)
 */

// =====================================
// 🔹 DISCORD ENTRY
// =====================================

export * from "./discord/QuickAddListener";

// =====================================
// 🔹 CORE
// =====================================

export * from "./core/QuickAddPipeline";
export * from "./core/QuickAddSession";
export * from "./core/QuickAddTypes";

// =====================================
// 🔹 OCR
// =====================================

export * from "./ocr/OCRProcessor";

// =====================================
// 🔹 PARSING
// =====================================

export * from "./parsing/ParserRouter";

// =====================================
// 🔹 MAPPING
// =====================================

export * from "./mapping/NicknameResolver";

// =====================================
// 🔹 VALIDATION
// =====================================

export * from "./validation/QuickAddValidator";

// =====================================
// 🔹 STORAGE
// =====================================

export * from "./storage/QuickAddRepository";
export * from "./storage/QuickAddBuffer";