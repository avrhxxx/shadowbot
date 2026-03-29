// src/system/events/eventsButtons/utils.ts

/**
 * Wyciąga ID eventu z customId przycisku lub modala.
 * BEZPIECZNE – obsługuje również modale i nie polega na lastIndexOf
 *
 * Obsługiwane formaty:
 * event_add_ID
 * event_remove_ID
 * event_absent_ID
 * event_show_list_ID
 * event_download_single_ID
 * event_compare_ID
 * event_clear_ID
 *
 * MODALE:
 * event_add_modal_ID
 * event_remove_modal_ID
 * event_absent_modal_ID
 */
export function parseEventId(customId: string): string {
  const prefixes = [
    "event_add_",
    "event_remove_",
    "event_absent_",
    "event_show_list_",
    "event_download_single_",
    "event_compare_",
    "event_clear_",

    // MODALE
    "event_add_modal_",
    "event_remove_modal_",
    "event_absent_modal_"
  ];

  for (const prefix of prefixes) {
    if (customId.startsWith(prefix)) {
      return customId.slice(prefix.length);
    }
  }

  throw new Error(`Unable to parse eventId from customId: ${customId}`);
}

/**
 * Specjalny parser dla:
 * compare_download_ID1_ID2
 *
 * BEZPIECZNY dla ID zawierających "_"
 */
export function parseCompareIds(customId: string): { idA: string; idB: string } {
  const prefix = "compare_download_";

  if (!customId.startsWith(prefix)) {
    throw new Error(`Invalid compare customId: ${customId}`);
  }

  const rest = customId.slice(prefix.length);

  // zamiast split — bierzemy pierwszy separator
  const separatorIndex = rest.indexOf("_");

  if (separatorIndex === -1) {
    throw new Error(`Invalid compare IDs in customId: ${customId}`);
  }

  const idA = rest.slice(0, separatorIndex);
  const idB = rest.slice(separatorIndex + 1);

  if (!idA || !idB) {
    throw new Error(`Invalid compare IDs in customId: ${customId}`);
  }

  return { idA, idB };
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