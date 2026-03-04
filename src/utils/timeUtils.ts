// src/utils/timeUtils.ts
import { DateTime } from "luxon";

/**
 * Formatuje datę UTC na lokalny czas w wybranej strefie IANA
 */
export function formatLocalDateFromUTCWithTimeZone(
  day: number,
  month: number,
  year: number,
  hour: number,
  minute: number,
  timeZone: string
) {
  return DateTime.fromUTC({ year, month, day, hour, minute })
    .setZone(timeZone)
    .toFormat("dd/MM HH:mm");
}

/**
 * Formatuje datę w UTC w DD/MM HH:MM
 */
export function formatUTCDate(day: number, month: number, year: number, hour: number, minute: number) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(day)}/${pad(month)} ${pad(hour)}:${pad(minute)}`;
}