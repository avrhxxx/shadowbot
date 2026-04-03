// =====================================
// 📁 src/shared/utils/timeUtils.ts
// =====================================

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
 * @param year - opcjonalny rok, jeśli go podamy, zostanie dołączony do tekstu
 */
export function formatEventUTC(
  day: number,
  month: number,
  hour: number,
  minute: number,
  year?: number
): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const base = `${pad(day)}/${pad(month)} ${pad(hour)}:${pad(minute)}`;
  return year ? `${base} ${year} UTC` : `${base} UTC`;
}

// =====================================
// DODATKOWE FUNKCJE DLA PRZYCISKÓW
// =====================================

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Zwraca odpowiedni sufiks dnia: 1st, 2nd, 3rd, 4th itd.
 */
export function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/**
 * Zwraca label do przycisku w formacie "5th April"
 */
export function formatButtonDate(day: number, month: number): string {
  const suffix = getDaySuffix(day);
  const monthName = MONTH_NAMES_EN[month - 1]; // month: 1-12
  return `${day}${suffix} ${monthName}`;
}