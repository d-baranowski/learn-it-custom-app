import { describe, it, expect } from '@jest/globals';
import { validateSessionForm, validateTherapyForm } from './custom-validations';

const tEn = ((key: string) => key) as never;
const tPl = ((key: string) =>
  key === 'Room is required for offline sessions'
    ? 'Pokój jest wymagany dla sesji stacjonarnych'
    : key) as never;

describe('validateSessionForm', () => {
  it('returns roomId error when offline and no room', () => {
    const errors = validateSessionForm({ isOnline: false, roomId: undefined }, tEn);
    expect(errors.roomId).toBe('Room is required for offline sessions');
  });

  it('returns roomId error when offline and empty room', () => {
    const errors = validateSessionForm({ isOnline: false, roomId: '' }, tEn);
    expect(errors.roomId).toBe('Room is required for offline sessions');
  });

  it('returns empty when offline with room', () => {
    const errors = validateSessionForm({ isOnline: false, roomId: 'rm-1' }, tEn);
    expect(errors).toEqual({});
  });

  it('returns empty when online regardless of room', () => {
    const errors = validateSessionForm({ isOnline: true, roomId: undefined }, tEn);
    expect(errors).toEqual({});
  });

  it('returns roomId error when isOnline is undefined and no room', () => {
    const errors = validateSessionForm({ roomId: undefined }, tEn);
    expect(errors.roomId).toBe('Room is required for offline sessions');
  });

  it('returns empty when isOnline undefined but roomId present', () => {
    const errors = validateSessionForm({ roomId: 'rm-1' }, tEn);
    expect(errors).toEqual({});
  });
});

describe('validateTherapyForm', () => {
  it('returns per-entry roomId error when offline entry has no room', () => {
    const errors = validateTherapyForm({
      sessionFrequency: [{ isOnline: false, roomId: undefined }],
    }, tEn);
    expect(errors['sessionFrequency.0.roomId']).toBe('Room is required for offline sessions');
  });

  it('validates multiple entries independently', () => {
    const errors = validateTherapyForm({
      sessionFrequency: [
        { isOnline: false, roomId: 'rm-1' },
        { isOnline: false, roomId: undefined },
        { isOnline: true, roomId: undefined },
      ],
    }, tEn);
    expect(errors['sessionFrequency.0.roomId']).toBeUndefined();
    expect(errors['sessionFrequency.1.roomId']).toBe('Room is required for offline sessions');
    expect(errors['sessionFrequency.2.roomId']).toBeUndefined();
  });

  it('returns empty when all entries are online', () => {
    const errors = validateTherapyForm({
      sessionFrequency: [{ isOnline: true }],
    }, tEn);
    expect(errors).toEqual({});
  });

  it('returns empty when offline entry has room assigned', () => {
    const errors = validateTherapyForm({
      sessionFrequency: [{ isOnline: false, roomId: 'rm-1' }],
    }, tEn);
    expect(errors).toEqual({});
  });

  it('returns empty when no session frequency', () => {
    const errors = validateTherapyForm({}, tEn);
    expect(errors).toEqual({});
  });
});

describe('custom validation translations', () => {
  it('translates session validation message when t is provided', () => {
    const errors = validateSessionForm({ isOnline: false, roomId: undefined }, tPl);
    expect(errors.roomId).toBe('Pokój jest wymagany dla sesji stacjonarnych');
  });

  it('translates therapy validation message when t is provided', () => {
    const errors = validateTherapyForm({
      sessionFrequency: [{ isOnline: false, roomId: undefined }],
    }, tPl);
    expect(errors['sessionFrequency.0.roomId']).toBe('Pokój jest wymagany dla sesji stacjonarnych');
  });
});
