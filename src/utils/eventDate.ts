export function getEventDateUTC(
  day: number,
  month: number,
  hour: number,
  minute: number
): Date {

  const now = new Date();
  let year = now.getUTCFullYear();

  let eventDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // jeśli już minął -> następny rok
  if (eventDate.getTime() < now.getTime()) {
    year += 1;
    eventDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  }

  return eventDate;
}