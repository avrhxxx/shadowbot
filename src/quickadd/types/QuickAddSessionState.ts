export type QuickAddSessionState =
  | "INIT"
  | "COLLECTING_DATA"
  | "PREVIEW_READY"
  | "CONFIRMED"
  | "CANCELLED"
  | "TIMEOUT";