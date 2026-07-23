import { useCallback, useState } from 'react';
import type { SessionPreview } from '@gen/core/v1/therapy_pb';
import type { OverrideState } from './types';

/**
 * Manages per-session overrides (inline edits) and computes effective
 * field values by merging the original session data with any overrides.
 */
export function useSessionOverrides() {
  const [overrides, setOverrides] = useState<Record<string, OverrideState>>({});

  /** Update a single override field for a session index. */
  const setOverrideField = useCallback(
    (
      idx: number,
      field: keyof OverrideState,
      value: string | boolean | undefined
    ) => {
      setOverrides((prev) => {
        const key = String(idx);
        const current = prev[key] || {};
        const updated = { ...current, [field]: value };
        // Remove the entry entirely when all fields are cleared
        if (
          updated.date === undefined &&
          updated.startTime === undefined &&
          updated.endTime === undefined &&
          updated.roomId === undefined &&
          updated.isOnline === undefined
        ) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: updated };
      });
    },
    []
  );

  /** Reset all overrides (e.g. on re-preview). */
  const clearOverrides = useCallback(() => setOverrides({}), []);

  // --- Effective-value getters ------------------------------------------------

  const getEffectiveDate = useCallback(
    (idx: number, session: Pick<SessionPreview, 'date'>): string => {
      return overrides[String(idx)]?.date ?? session.date;
    },
    [overrides]
  );

  const getEffectiveStartTime = useCallback(
    (idx: number, session: Pick<SessionPreview, 'startTime'>): string => {
      return overrides[String(idx)]?.startTime ?? session.startTime;
    },
    [overrides]
  );

  const getEffectiveEndTime = useCallback(
    (idx: number, session: Pick<SessionPreview, 'endTime'>): string => {
      return overrides[String(idx)]?.endTime ?? session.endTime;
    },
    [overrides]
  );

  const getEffectiveRoomId = useCallback(
    (
      idx: number,
      session: Pick<SessionPreview, 'roomId'>
    ): string | undefined => {
      const ovr = overrides[String(idx)];
      if (ovr && ovr.roomId !== undefined) return ovr.roomId;
      return session.roomId;
    },
    [overrides]
  );

  const getEffectiveOnline = useCallback(
    (idx: number, session: Pick<SessionPreview, 'isOnline'>): boolean => {
      const ovr = overrides[String(idx)];
      if (ovr && ovr.isOnline !== undefined) return ovr.isOnline;
      return session.isOnline;
    },
    [overrides]
  );

  return {
    overrides,
    setOverrideField,
    clearOverrides,
    getEffectiveDate,
    getEffectiveStartTime,
    getEffectiveEndTime,
    getEffectiveRoomId,
    getEffectiveOnline,
  };
}
