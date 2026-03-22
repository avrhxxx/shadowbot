// src/quickadd/core/QuickAddTypes.ts

export type QuickAddType =
  | "DONATIONS"
  | "DUEL_POINTS"
  | "RR_ATTENDANCE"
  | "RR_RAID";

export interface OCRResult {
  text: string;
  lines: string[];
}

export interface ParsedEntry {
  nickname: string;
  value: number;
  raw?: string;
  confidence?: number;
}

export interface ParsedScreen {
  type: QuickAddType;
  entries: ParsedEntry[];
}

export interface QuickAddSession {
  buffer: {
    ocrResults: {
      lines: string[];
      traceId: string;
    }[];
    timer: NodeJS.Timeout | null;
  };
  pendingOCR: number;
  isProcessing: boolean;
  imageCount: number;
  parserType?: QuickAddType;
}