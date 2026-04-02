export function getFutureDays(daysAhead = 14) {
  const days: { label: string; value: string }[] = [];
  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      value: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
    });
  }
  return days;
}