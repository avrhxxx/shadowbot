// src/utils/timeUtils.ts

/**
 * Zwraca najbliższą przyszłą datę eventu w UTC.
 * Jeśli podano yearProvided = true → używamy bieżącego roku (lub podanego),
 * nie przeskakujemy automatycznie na następny rok.
 */
export function getEventDateUTC(
  day: number,
  month: number,
  hour: number,
  minute: number,
  yearProvided = false
): Date {
  const now = new Date();
  let year = now.getUTCFullYear();

  let eventDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // jeśli data już minęła i nie podano jawnie roku → użyj następnego roku
  if (eventDate.getTime() <= now.getTime() && !yearProvided) {
    year += 1;
    eventDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  }

  return eventDate;
}

/**
 * Formatowanie daty eventu do wyświetlenia
 */
export function formatEventUTC(
  day: number,
  month: number,
  hour: number,
  minute: number
): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(day)}/${pad(month)} ${pad(hour)}:${pad(minute)} UTC`;
}