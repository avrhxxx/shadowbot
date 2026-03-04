/**
 * Formatuje datę w UTC w DD/MM HH:MM
 */
export function formatUTCDate(day: number, month: number, year: number, hour: number, minute: number) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(day)}/${pad(month)} ${pad(hour)}:${pad(minute)}`;
}

/**
 * Formatuje datę z UTC + offset w DD/MM HH:MM
 */
export function formatLocalDateFromUTCWithOffset(
  day: number,
  month: number,
  year: number,
  hour: number,
  minute: number,
  offset: number
) {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const localDate = new Date(utcDate.getTime() + offset * 60 * 60 * 1000);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(localDate.getDate())}/${pad(localDate.getMonth() + 1)} ${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
}