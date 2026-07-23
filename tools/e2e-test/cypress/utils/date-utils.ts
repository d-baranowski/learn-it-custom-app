// Canonical date helpers for specs — the same handful of functions used to
// be re-declared per spec/group with drifting shapes. Formatters take a
// Date; day-finders return a Date so callers pick their own format.

export function formatDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatDateISO(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function getTodayFormatted(): string {
  return formatDDMMYYYY(new Date());
}

export function getTomorrowFormatted(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDDMMYYYY(d);
}

export function getDateFromToday(offsetDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export function getNextMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Next weekday strictly after today (skips Saturday/Sunday). */
export function getNextWeekday(): Date {
  const d = new Date();
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}

/** Most recent weekday strictly before today (skips Saturday/Sunday). */
export function getLastWeekday(): Date {
  const d = new Date();
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}
