// src/utils/timeUtils.ts

/**
 * Zwraca literalną datę eventu w UTC.
 * Funkcja NIE przesuwa daty na następny rok.
 * Logika „Next Year / Cancel” powinna być obsługiwana w submit handlerze.
 */
export function getEventDateUTC(
  day: number,
  month: number,
  hour: number,
  minute: number,
  year?: number
): Date {
  const useYear = year ?? new Date().getUTCFullYear();
  return new Date(Date.UTC(useYear, month - 1, day, hour, minute));
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