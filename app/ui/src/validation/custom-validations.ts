import { SessionFrequencyEntry } from '@gen/core/v1/therapy_pb';
import type { TFunction } from 'next-i18next';

const offlineRoomRequired = (t?: TFunction): string =>
  t ? (t('Room is required for offline sessions') as string) : 'Room is required for offline sessions';

export function validateTherapyForm(
  values: Record<string, unknown>,
  t?: TFunction
): Record<string, string> {
  const errors: Record<string, string> = {};

  const sessionFrequency = values.sessionFrequency as
    | SessionFrequencyEntry[]
    | undefined;

  sessionFrequency?.forEach((entry, index) => {
    if (!entry.isOnline && !entry.roomId) {
      errors[`sessionFrequency.${index}.roomId`] = offlineRoomRequired(t);
    }
  });

  return errors;
}

/**
 * Custom validation function for Session form.
 * Validates that when isOnline is false, a room must be assigned.
 */
export function validateSessionForm(
  values: Record<string, unknown>,
  t?: TFunction
): Record<string, string> {
  const errors: Record<string, string> = {};

  const isOnline = values.isOnline as boolean | undefined;
  const roomId = values.roomId as string | undefined;

  // If session is not online but no room assigned, show error
  if (!isOnline && !roomId) {
    errors.roomId = offlineRoomRequired(t);
  }

  return errors;
}
