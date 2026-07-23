import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useSessionOverrides } from './use_session_overrides';

describe('useSessionOverrides', () => {
  it('starts with empty overrides', () => {
    const { result } = renderHook(() => useSessionOverrides());
    expect(result.current.overrides).toEqual({});
  });

  it('setOverrideField adds an override for a session index', () => {
    const { result } = renderHook(() => useSessionOverrides());
    act(() => {
      result.current.setOverrideField(0, 'date', '2026-06-15');
    });
    expect(result.current.overrides['0']).toEqual({ date: '2026-06-15' });
  });

  it('setOverrideField merges multiple fields for the same index', () => {
    const { result } = renderHook(() => useSessionOverrides());
    act(() => {
      result.current.setOverrideField(0, 'date', '2026-06-15');
      result.current.setOverrideField(0, 'startTime', '10:00');
    });
    expect(result.current.overrides['0']).toEqual({
      date: '2026-06-15',
      startTime: '10:00',
    });
  });

  it('removes the entry when all fields are cleared', () => {
    const { result } = renderHook(() => useSessionOverrides());
    act(() => {
      result.current.setOverrideField(0, 'date', '2026-06-15');
    });
    expect(result.current.overrides['0']).toBeDefined();
    act(() => {
      result.current.setOverrideField(0, 'date', undefined);
    });
    expect(result.current.overrides['0']).toBeUndefined();
  });

  it('clearOverrides resets all overrides', () => {
    const { result } = renderHook(() => useSessionOverrides());
    act(() => {
      result.current.setOverrideField(0, 'date', '2026-06-15');
      result.current.setOverrideField(1, 'roomId', 'rm-1');
    });
    expect(Object.keys(result.current.overrides)).toHaveLength(2);
    act(() => {
      result.current.clearOverrides();
    });
    expect(result.current.overrides).toEqual({});
  });

  it('tracks overrides for different indices independently', () => {
    const { result } = renderHook(() => useSessionOverrides());
    act(() => {
      result.current.setOverrideField(0, 'isOnline', true);
      result.current.setOverrideField(3, 'roomId', 'rm-2');
    });
    expect(result.current.overrides['0']).toEqual({ isOnline: true });
    expect(result.current.overrides['3']).toEqual({ roomId: 'rm-2' });
  });

  describe('effective value getters', () => {
    it('getEffectiveDate returns override when present', () => {
      const { result } = renderHook(() => useSessionOverrides());
      act(() => {
        result.current.setOverrideField(0, 'date', '2026-07-01');
      });
      expect(result.current.getEffectiveDate(0, { date: '2026-06-01' })).toBe('2026-07-01');
    });

    it('getEffectiveDate returns original when no override', () => {
      const { result } = renderHook(() => useSessionOverrides());
      expect(result.current.getEffectiveDate(0, { date: '2026-06-01' })).toBe('2026-06-01');
    });

    it('getEffectiveStartTime returns override when present', () => {
      const { result } = renderHook(() => useSessionOverrides());
      act(() => {
        result.current.setOverrideField(0, 'startTime', '14:00');
      });
      expect(result.current.getEffectiveStartTime(0, { startTime: '10:00' })).toBe('14:00');
    });

    it('getEffectiveEndTime returns original when no override', () => {
      const { result } = renderHook(() => useSessionOverrides());
      expect(result.current.getEffectiveEndTime(2, { endTime: '11:30' })).toBe('11:30');
    });

    it('getEffectiveRoomId returns override when present', () => {
      const { result } = renderHook(() => useSessionOverrides());
      act(() => {
        result.current.setOverrideField(0, 'roomId', 'rm-new');
      });
      expect(result.current.getEffectiveRoomId(0, { roomId: 'rm-old' })).toBe('rm-new');
    });

    it('getEffectiveRoomId returns original when no override', () => {
      const { result } = renderHook(() => useSessionOverrides());
      expect(result.current.getEffectiveRoomId(0, { roomId: 'rm-1' })).toBe('rm-1');
    });

    it('getEffectiveOnline returns override when present', () => {
      const { result } = renderHook(() => useSessionOverrides());
      act(() => {
        result.current.setOverrideField(0, 'isOnline', true);
      });
      expect(result.current.getEffectiveOnline(0, { isOnline: false })).toBe(true);
    });

    it('getEffectiveOnline returns original when no override', () => {
      const { result } = renderHook(() => useSessionOverrides());
      expect(result.current.getEffectiveOnline(0, { isOnline: false })).toBe(false);
    });
  });
});
