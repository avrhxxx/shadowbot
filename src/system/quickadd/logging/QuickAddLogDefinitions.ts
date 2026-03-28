// =====================================
// 📁 src/quickadd/logging/QuickAddLogDefinitions.ts
// =====================================

/**
 * 🧾 ROLE:
 * Single source of truth for ALL QuickAdd logs.
 *
 * ❗ RULES:
 * - ONLY event names (no logic)
 * - grouped by domain/layer
 * - future-proof (easy to extend)
 *
 * ✅ USED BY:
 * - QuickAddLogger (builder)
 * - whole QuickAdd system
 */

export const QuickAddLogDefinitions = {
  // =====================================
  // 🚀 SESSION / COMMANDS
  // =====================================

  START: {
    REQUESTED: "start_requested",
    STARTED: "start_start",
    DONE: "start_done",
    FAILED: "start_failed",
  },

  END: {
    REQUESTED: "end_requested",
    DONE: "end_done",
    FAILED: "end_failed",
  },

  FIX: {
    REQUESTED: "fix_requested",
    STARTED: "fix_start",
    DONE: "fix_done",
    FAILED: "fix_failed",
    REVALIDATION_MISMATCH: "fix_revalidation_mismatch",
  },

  PREVIEW: {
    REQUESTED: "preview_requested",
    EMPTY: "preview_empty",
    DONE: "preview_done",
    FAILED: "preview_failed",
  },

  // =====================================
  // 🧠 SESSION CORE
  // =====================================

  SESSION: {
    CREATED: "session_created",
    ENDED: "session_ended",
    THREAD_ATTACHED: "session_thread_attached",
    NOT_FOUND: "session_not_found",
  },

  // =====================================
  // 🧵 THREAD
  // =====================================

  THREAD: {
    CREATED: "thread_created",
    DELETED: "thread_deleted",
    DELETE_FAILED: "thread_delete_failed",
  },

  // =====================================
  // 🛡️ GUARDS
  // =====================================

  GUARD: {
    CONTEXT_INVALID: "guard_context_invalid",
    NOT_OWNER: "guard_not_owner",
    NO_SESSION: "guard_no_session",
  },

  // =====================================
  // 💬 INTERACTION (Discord layer)
  // =====================================

  INTERACTION: {
    RECEIVED: "interaction_received",
    REPLIED: "interaction_replied",
    FAILED: "interaction_failed",
  },

  // =====================================
  // 📦 BUFFER
  // =====================================

  BUFFER: {
    LOADED: "buffer_loaded",
    EMPTY: "buffer_empty",
    CLEARED: "buffer_cleared",
    REPLACED: "buffer_replaced",
  },

  // =====================================
  // 🔍 OCR
  // =====================================

  OCR: {
    STARTED: "ocr_started",
    DONE: "ocr_done",
    FAILED: "ocr_failed",
  },

  // =====================================
  // 🧩 PARSER
  // =====================================

  PARSER: {
    INPUT: "parser_input",
    OUTPUT: "parser_output",
    FAILED: "parser_failed",
  },

  // =====================================
  // ✅ VALIDATION
  // =====================================

  VALIDATION: {
    STARTED: "validation_started",
    DONE: "validation_done",
    FAILED: "validation_failed",
    DUPLICATE: "validation_duplicate",
  },

  // =====================================
  // 📤 STORAGE
  // =====================================

  STORAGE: {
    QUEUED: "storage_queued",
    SUCCESS: "storage_success",
    FAILED: "storage_failed",
    RETRY: "storage_retry",
  },

  // =====================================
  // ⚙️ PIPELINE
  // =====================================

  PIPELINE: {
    STARTED: "pipeline_started",
    STEP_STARTED: "pipeline_step_started",
    STEP_SKIPPED: "pipeline_step_skipped",
    STEP_FAILED: "pipeline_step_failed",
    DONE: "pipeline_done",
    ERROR: "pipeline_error",
  },

} as const;

// =====================================
// 🔹 TYPES
// =====================================

export type QuickAddLogDefinition =
  (typeof QuickAddLogDefinitions)[keyof typeof QuickAddLogDefinitions][keyof any];