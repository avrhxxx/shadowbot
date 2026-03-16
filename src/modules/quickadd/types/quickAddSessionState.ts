// Stany sesji QuickAdd
export enum QuickAddSessionState {
  INIT = 'INIT',                 // sesja dopiero startuje
  COLLECTING_DATA = 'COLLECTING_DATA', // dane wprowadzane
  PREVIEW_READY = 'PREVIEW_READY',     // bufor gotowy do podglądu
  CONFIRMED = 'CONFIRMED',       // moderator zatwierdził dane
  CANCELLED = 'CANCELLED',       // sesja anulowana
  TIMEOUT = 'TIMEOUT'            // sesja zakończona timeoutem
}