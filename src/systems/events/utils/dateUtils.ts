// 📁 src/systems/events/utils/dateUtils.ts
export function getFutureDays(daysAhead = 7, includeToday = true) {
  const days: { label: string; value: string }[] = [];
  const today = new Date();

  // jeśli includeToday, zaczynamy od dzisiaj, inaczej od jutra
  const startOffset = includeToday ? 0 : 1;

  for (let i = startOffset; i < daysAhead + startOffset; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const day = d.getDate();
    const month = d.getMonth() + 1; // 0-indexed
    const year = d.getFullYear();

    days.push({
      label: `${day} ${MONTH_NAMES[d.getMonth()]}`, // pełna nazwa miesiąca
      value: `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
    });
  }

  return days;
}

// pełne nazwy miesięcy
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];