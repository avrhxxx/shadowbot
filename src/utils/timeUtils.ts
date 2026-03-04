// src/utils/timeUtils.ts

/**
 * Formatuje datę w UTC w DD/MM HH:MM
 */
export function formatUTCDate(day: number, month: number, year: number, hour: number, minute: number) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(day)}/${pad(month)} ${pad(hour)}:${pad(minute)}`;
}

/**
 * Formatuje datę z UTC na lokalny czas użytkownika w DD/MM HH:MM
 */
export function formatLocalDateFromUTC(day: number, month: number, year: number, hour: number, minute: number) {
  // Tworzymy datę UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  // Pobieramy faktyczny lokalny czas użytkownika
  const localDay = pad(utcDate.getDate());
  const localMonth = pad(utcDate.getMonth() + 1);
  const localHour = pad(utcDate.getHours());
  const localMinute = pad(utcDate.getMinutes());
  return `${localDay}/${localMonth} ${localHour}:${localMinute}`;
}