// src/quickadd/core/QuickAddSession.ts

import { QuickAddSession } from "./QuickAddTypes";

export function createSession(): QuickAddSession {
  return {
    buffer: {
      ocrResults: [],
      timer: null,
    },
    pendingOCR: 0,
    isProcessing: false,
    imageCount: 0,
  };
}