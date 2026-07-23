import { describe, expect, it } from '@jest/globals';

import {
  WORKING_HOURS_TEMPLATES,
  applyTemplateDraft,
  buildDraftWeek,
  canPlaceRange,
  duplicateDraftBlock,
  findDraftBlock,
  formatMinutes,
  getActiveDayCount,
  getTotalMinutes,
  moveDraftBlock,
  parseTimeToMinutes,
  replaceDayWithSource,
  resizeDraftBlock,
  serializeDraftWeek,
  splitDraftBlock,
} from './working_hours_editor_utils';

describe('working_hours_editor_utils', () => {
  it('parses HH:MM and HH:MM:SS', () => {
    expect(parseTimeToMinutes('08:30')).toBe(510);
    expect(parseTimeToMinutes('08:30:00')).toBe(510);
    expect(parseTimeToMinutes('25:00')).toBeNull();
  });

  it('builds and serializes a sorted week draft', () => {
    const draft = buildDraftWeek([
      { id: 'b', dayOfWeek: 3, fromTime: '13:00:00', tillTime: '17:00:00' },
      { id: 'a', dayOfWeek: 1, fromTime: '08:00', tillTime: '12:00' },
    ]);

    expect(formatMinutes(draft[1][0].startMinutes)).toBe('08:00');
    expect(serializeDraftWeek(draft)).toEqual([
      { dayOfWeek: 1, fromTime: '08:00:00', tillTime: '12:00:00' },
      { dayOfWeek: 3, fromTime: '13:00:00', tillTime: '17:00:00' },
    ]);
  });

  it('duplicates a block into the next available same-day slot', () => {
    const draft = buildDraftWeek([
      { id: 'first', dayOfWeek: 1, fromTime: '08:00', tillTime: '10:00' },
      { id: 'second', dayOfWeek: 1, fromTime: '12:00', tillTime: '14:00' },
    ]);

    const duplicated = duplicateDraftBlock(draft, 'first');
    expect(duplicated).not.toBeNull();
    const nextBlock = duplicated![1].find((block) => block.id !== 'first' && block.id !== 'second');
    expect(nextBlock).toMatchObject({ startMinutes: 600, endMinutes: 720 });
  });

  it('splits a block with a lunch gap', () => {
    const draft = buildDraftWeek([
      { id: 'full', dayOfWeek: 4, fromTime: '08:00', tillTime: '18:00' },
    ]);

    const split = splitDraftBlock(draft, 'full');
    expect(split).not.toBeNull();
    expect(split![4]).toHaveLength(2);
    expect(split![4][0]).toMatchObject({ startMinutes: 480, endMinutes: 750 });
    expect(split![4][1]).toMatchObject({ startMinutes: 810, endMinutes: 1080 });
  });

  it('applies the template and computes totals', () => {
    const template = WORKING_HOURS_TEMPLATES.find((item) => item.id === 'mon_fri_with_lunch');
    const draft = applyTemplateDraft(template!);

    expect(getActiveDayCount(draft)).toBe(5);
    expect(getTotalMinutes(draft)).toBe(5 * 8 * 60);
    const mondayFirst = findDraftBlock(draft, draft[1][0].id);
    expect(mondayFirst?.block.startMinutes).toBe(480);
  });

  it('moves and resizes a block within valid day bounds', () => {
    const draft = buildDraftWeek([
      { id: 'first', dayOfWeek: 1, fromTime: '08:00', tillTime: '10:00' },
      { id: 'second', dayOfWeek: 1, fromTime: '12:00', tillTime: '14:00' },
    ]);

    const moved = moveDraftBlock(draft, 'second', 9 * 60);
    expect(moved).not.toBeNull();
    expect(moved![1][1]).toMatchObject({ startMinutes: 600, endMinutes: 720 });

    const resized = resizeDraftBlock(moved!, 'first', 'right', 11 * 60);
    expect(resized).not.toBeNull();
    expect(resized![1][0]).toMatchObject({ startMinutes: 480, endMinutes: 600 });
    expect(canPlaceRange(resized![1], 9 * 60, 11 * 60)).toBe(false);
  });

  it('copies a source day into selected target days', () => {
    const draft = buildDraftWeek([
      { id: 'monday', dayOfWeek: 1, fromTime: '09:00', tillTime: '12:00' },
    ]);

    const copied = replaceDayWithSource(draft, 1, [3, 5]);
    expect(copied[3][0]).toMatchObject({ startMinutes: 540, endMinutes: 720, dayOfWeek: 3 });
    expect(copied[5][0]).toMatchObject({ startMinutes: 540, endMinutes: 720, dayOfWeek: 5 });
  });
});
