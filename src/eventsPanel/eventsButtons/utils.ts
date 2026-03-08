// src/eventsPanel/eventsButtons/utils.ts

/**
 * Wyciąga ID eventu z customId przycisku lub modala.
 * Zakłada, że ID eventu jest ostatnią częścią po "_"
 */
export function parseEventId(customId: string): string {
  return customId.split("_").pop()!;
}

/* ===========================
   DYNAMICZNE CUSTOM ID BUTTONÓW
=========================== */

/** Add participant */
export function makeAddParticipantId(eventId: string): string {
  return `event_add_${eventId}`;
}

/** Remove participant */
export function makeRemoveParticipantId(eventId: string): string {
  return `event_remove_${eventId}`;
}

/** Mark absent */
export function makeAbsentParticipantId(eventId: string): string {
  return `event_absent_${eventId}`;
}

/** Show participant list */
export function makeShowListId(eventId: string): string {
  return `event_show_list_${eventId}`;
}

/** Download single event */
export function makeDownloadSingleId(eventId: string): string {
  return `event_download_single_${eventId}`;
}

/** Compare single event */
export function makeCompareId(eventId: string): string {
  return `event_compare_${eventId}`;
}

/** Clear event data */
export function makeClearEventId(eventId: string): string {
  return `event_clear_${eventId}`;
}

/* ===========================
   DYNAMICZNE CUSTOM ID SELECTÓW
=========================== */

/** Compare select menu for a single event */
export function makeCompareSelectId(eventId: string): string {
  return `compare_select_${eventId}`;
}