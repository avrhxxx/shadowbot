// =====================================
// 📁 src/quickadd/ids/QuickAddIds.ts
// =====================================

import {
  createTraceId,
  createSessionId,
  createQueueId,
  resolveDisplayId,
} from "../../ids/IdGenerator";

// =====================================
// 🔹 PREFIX
// =====================================

const PREFIX = "qa";

// =====================================
// 🔥 QUICKADD IDS
// =====================================

export const QuickAddIds = {
  trace() {
    return `${PREFIX}-${createTraceId()}`;
  },

  session() {
    return `${PREFIX}-${createSessionId()}`;
  },

  queue() {
    return `${PREFIX}-${createQueueId()}`;
  },

  display(realId: string) {
    return resolveDisplayId(realId);
  },
};