// =====================================
// 📁 src/quickadd/logging/QuickAddLogDefinitions.ts
// =====================================

export const QuickAddLogDefinitions = {
  start: {
    requested: "quickadd.start.requested",
    start: "quickadd.start.start",
    done: "quickadd.start.done",
    failed: "quickadd.start.failed",
  },

  fix: {
    requested: "quickadd.fix.requested",
    start: "quickadd.fix.start",
    done: "quickadd.fix.done",
    failed: "quickadd.fix.failed",
    mismatch: "quickadd.fix.revalidation_mismatch",
  },

  preview: {
    requested: "quickadd.preview.requested",
    empty: "quickadd.preview.empty",
    done: "quickadd.preview.done",
    failed: "quickadd.preview.failed",
  },

  cancel: {
    start: "quickadd.cancel.start",
    done: "quickadd.cancel.done",
    failed: "quickadd.cancel.failed",
    guardFailed: "quickadd.cancel.guard_failed",
  },

  confirm: {
    start: "quickadd.confirm.start",
    done: "quickadd.confirm.done",
    failed: "quickadd.confirm.failed",
    blockedInvalid: "quickadd.confirm.blocked_invalid",
    blockedStage: "quickadd.confirm.blocked_stage",
    missingTarget: "quickadd.confirm.missing_target",
    empty: "quickadd.confirm.empty",
  },

  adjust: {
    start: "quickadd.adjust.start",
    done: "quickadd.adjust.done",
    failed: "quickadd.adjust.failed",
    blocked: "quickadd.adjust.blocked",
    applied: "quickadd.adjust.applied",
  },

  end: {
    requested: "quickadd.end.requested",
    start: "quickadd.end.start",
    done: "quickadd.end.done",
    failed: "quickadd.end.failed",
    threadDeleted: "quickadd.end.thread_deleted",
    threadDeleteFailed: "quickadd.end.thread_delete_failed",
  },
};



// =====================================
// 📁 src/quickadd/logging/QuickAddLogger.ts
// =====================================

import { createLogger } from "../../logger/builder/createLogger";
import { QuickAddLogDefinitions } from "./QuickAddLogDefinitions";

// 🔥 AUTO-GENERATED LOGGER
export const QuickAddLogger = createLogger(
  QuickAddLogDefinitions
);



// =====================================
// 📁 src/quickadd/logging/index.ts
// =====================================

export { QuickAddLogger } from "./QuickAddLogger";