/**
 * Zwraca najbliższą przyszłą datę eventu w UTC.
 * Rok NIE jest zapisywany w eventach — wyliczamy go dynamicznie.
 */
export function getEventDateUTC(
  day: number,
  month: number,
  hour: number,
  minute: number
): Date {

  const now = new Date();

  let year = now.getUTCFullYear();

  let eventDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute)
  );

  // jeśli data już minęła → event jest w następnym roku
  if (eventDate.getTime() < now.getTime()) {
    year += 1;

    eventDate = new Date(
      Date.UTC(year, month - 1, day, hour, minute)
    );
  }

  return eventDate;
}


/**
 * Formatowanie daty eventu do wyświetlenia
 * np. 07/03 09:10 UTC
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