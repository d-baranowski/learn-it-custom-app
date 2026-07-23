import { describe, it, expect } from '@jest/globals';
import {
  parseTranslatedLabel,
  formatDateTime,
  getDayOfWeek,
  dateToYMD,
  getDefaultFromDate,
  getDefaultUntilDate,
  getMaxUntilDate,
  startOfDay,
  endOfDay,
} from './utils';

describe('parseTranslatedLabel', () => {
  it('returns locale value when present', () => {
    const json = JSON.stringify({ en: 'Therapy', pl: 'Terapia' });
    expect(parseTranslatedLabel(json, 'pl')).toBe('Terapia');
  });

  it('falls back to en when requested locale is missing', () => {
    const json = JSON.stringify({ en: 'Therapy' });
    expect(parseTranslatedLabel(json, 'pl')).toBe('Therapy');
  });

  it('falls back to pl when en is also missing', () => {
    const json = JSON.stringify({ pl: 'Terapia' });
    expect(parseTranslatedLabel(json, 'vi')).toBe('Terapia');
  });

  it('falls back to vi when en and pl are missing', () => {
    const json = JSON.stringify({ vi: 'Liệu pháp' });
    expect(parseTranslatedLabel(json, 'de')).toBe('Liệu pháp');
  });

  it('returns raw JSON string when object has no locale keys', () => {
    const json = JSON.stringify({ foo: 'bar' });
    expect(parseTranslatedLabel(json, 'en')).toBe(json);
  });

  it('returns raw string when not valid JSON', () => {
    expect(parseTranslatedLabel('plain text', 'en')).toBe('plain text');
  });

  it('returns raw string when JSON is not a translated object', () => {
    expect(parseTranslatedLabel('"just a string"', 'en')).toBe('"just a string"');
  });

  it('returns dash when undefined', () => {
    expect(parseTranslatedLabel(undefined, 'en')).toBe('-');
  });

  it('returns dash when empty string', () => {
    expect(parseTranslatedLabel('', 'en')).toBe('-');
  });
});

describe('dateToYMD', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(dateToYMD(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('pads single-digit month and day', () => {
    expect(dateToYMD(new Date(2026, 2, 3))).toBe('2026-03-03');
  });

  it('handles December correctly', () => {
    expect(dateToYMD(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('startOfDay', () => {
  it('sets time to midnight', () => {
    const d = new Date(2026, 4, 27, 14, 30, 45, 123);
    const result = startOfDay(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('does not mutate the original date', () => {
    const d = new Date(2026, 4, 27, 14, 30);
    startOfDay(d);
    expect(d.getHours()).toBe(14);
  });

  it('preserves the date', () => {
    const d = new Date(2026, 4, 27, 23, 59);
    const result = startOfDay(d);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(27);
  });
});

describe('endOfDay', () => {
  it('sets time to 23:59:59.999', () => {
    const d = new Date(2026, 4, 27, 8, 0);
    const result = endOfDay(d);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it('does not mutate the original date', () => {
    const d = new Date(2026, 4, 27, 8, 0);
    endOfDay(d);
    expect(d.getHours()).toBe(8);
  });
});

describe('getDefaultFromDate', () => {
  it('returns a Date for today', () => {
    const result = getDefaultFromDate();
    const now = new Date();
    expect(result.getFullYear()).toBe(now.getFullYear());
    expect(result.getMonth()).toBe(now.getMonth());
    expect(result.getDate()).toBe(now.getDate());
  });
});

describe('getDefaultUntilDate', () => {
  it('returns a Date one month from today', () => {
    const result = getDefaultUntilDate();
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 1);
    expect(result.getMonth()).toBe(expected.getMonth());
  });
});

describe('getMaxUntilDate', () => {
  it('returns a Date MAX_MONTHS ahead of the given from date', () => {
    const from = new Date(2026, 0, 1);
    const result = getMaxUntilDate(from);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('does not mutate the input date', () => {
    const from = new Date(2026, 0, 1);
    getMaxUntilDate(from);
    expect(from.getMonth()).toBe(0);
  });
});

describe('getDayOfWeek', () => {
  it('returns weekday name for a date string in English', () => {
    const result = getDayOfWeek('2026-05-27', 'en');
    expect(result.toLowerCase()).toContain('wednesday');
  });

  it('returns weekday name for a date string in Polish', () => {
    const result = getDayOfWeek('2026-05-27', 'pl');
    expect(result.toLowerCase()).toContain('środa');
  });
});

describe('formatDateTime', () => {
  it('returns a locale string combining date and time', () => {
    const result = formatDateTime('2026-05-27', '14:30');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});
