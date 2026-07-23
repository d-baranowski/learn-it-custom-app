import { describe, it, expect } from '@jest/globals';
import { addMinutesToTime, diffMinutes } from './session_time_utils';

describe('addMinutesToTime', () => {
  it('adds minutes within same hour', () => {
    expect(addMinutesToTime('10:00', 30)).toBe('10:30');
  });

  it('adds 50 minutes (default session duration)', () => {
    expect(addMinutesToTime('10:00', 50)).toBe('10:50');
  });

  it('crosses hour boundary', () => {
    expect(addMinutesToTime('10:40', 30)).toBe('11:10');
  });

  it('wraps past midnight', () => {
    expect(addMinutesToTime('23:30', 50)).toBe('00:20');
  });

  it('handles zero minutes', () => {
    expect(addMinutesToTime('14:30', 0)).toBe('14:30');
  });

  it('handles exact hour result', () => {
    expect(addMinutesToTime('09:00', 60)).toBe('10:00');
  });

  it('pads single-digit hours and minutes', () => {
    expect(addMinutesToTime('00:05', 3)).toBe('00:08');
  });
});

describe('diffMinutes', () => {
  it('returns positive diff for normal range', () => {
    expect(diffMinutes('10:00', '10:50')).toBe(50);
  });

  it('returns 0 for same time', () => {
    expect(diffMinutes('09:00', '09:00')).toBe(0);
  });

  it('returns negative for reversed range', () => {
    expect(diffMinutes('10:50', '10:00')).toBe(-50);
  });

  it('returns null for undefined start', () => {
    expect(diffMinutes(undefined, '10:50')).toBeNull();
  });

  it('returns null for undefined end', () => {
    expect(diffMinutes('10:00', undefined)).toBeNull();
  });

  it('returns null for empty string start', () => {
    expect(diffMinutes('', '10:50')).toBeNull();
  });

  it('returns null for NaN segments', () => {
    expect(diffMinutes('ab:cd', '10:50')).toBeNull();
  });

  it('handles cross-hour diff', () => {
    expect(diffMinutes('09:30', '11:15')).toBe(105);
  });
});
