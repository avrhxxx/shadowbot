import type { QuickAddEntry } from './QuickAddEntry';

export type SessionStatus = 
  | 'INIT'
  | 'COLLECTING_DATA'
  | 'PREVIEW_READY'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'TIMEOUT';

export interface QuickAddSessionState {
  sessionId: string;                  // unikalny identyfikator sesji
  eventType: 'RR' | 'DP' | 'DN';      // Reservoir Raid / Duel Points / Donations
  startedBy: string;                  // Discord ID moderatora
  startedAt: number;                  // timestamp rozpoczęcia
  lastActivityAt: number;             // timestamp ostatniej aktywności
  status: SessionStatus;
  previewBuffer: QuickAddEntry[];     // aktualny bufor preview
  timeoutWarningSent: boolean;        // czy wysłano ostrzeżenie przed timeoutem
}