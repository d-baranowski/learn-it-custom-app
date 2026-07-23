import { useCallback, useMemo, useState } from 'react';
import { createConnectQueryKey, useMutation } from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';
import {
  dryRunGenerateSessions,
  generateSessions,
  get as getTherapy,
  getFutureGeneratedSessions,
  deleteFutureGeneratedSessions,
  getLastSessionDate,
} from '@gen/core/v1/therapy-TherapyService_connectquery';
import { SessionOverride } from '@gen/core/v1/therapy_pb';
import type { SessionPreview } from '@gen/core/v1/therapy_pb';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'next-i18next';

import { dispatchRpgWindowEvent } from '~/_lib/window/window-events';
import type { PreviewMode, OverrideState, SessionRow } from './types';
import {
  startOfDay,
  endOfDay,
  getDefaultFromDate,
  getDefaultUntilDate,
  getMaxUntilDate,
  dateToYMD,
} from './utils';

interface UseSessionPreviewArgs {
  therapyId?: string;
  mode: PreviewMode;
  overrides: Record<string, OverrideState>;
  excludedIndices: Set<number>;
  clearOverrides: () => void;
  afterSave?: (formData?: any) => void;
}

export function useSessionPreview({
  therapyId,
  mode,
  overrides,
  excludedIndices,
  clearOverrides,
  afterSave,
}: UseSessionPreviewArgs) {
  const { t } = useTranslation();

  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Date range state (generate mode)
  const [generateFrom, setGenerateFrom] = useState<Date>(getDefaultFromDate());
  const [generateUntil, setGenerateUntil] = useState<Date>(
    getDefaultUntilDate()
  );

  // Excluded indices: sessions the user has opted out of generating.
  const [localExcludedIndices, setExcludedIndices] = useState<Set<number>>(
    new Set()
  );

  // Use the passed-in excludedIndices from the orchestrator
  const effectiveExcluded = excludedIndices;

  // Confirmation dialog for re-preview
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { mutateAsync: dryRunFn } = useMutation(dryRunGenerateSessions);
  const { mutateAsync: generateFn } = useMutation(generateSessions);
  const { mutateAsync: getFutureFn } = useMutation(getFutureGeneratedSessions);
  const { mutateAsync: deleteFutureFn } = useMutation(
    deleteFutureGeneratedSessions
  );
  const { mutateAsync: getLastSessionDateFn } = useMutation(getLastSessionDate);

  // Determine if user has unsaved edits
  const hasEdits = useMemo(() => {
    if (Object.keys(overrides).length > 0) return true;
    for (const idx of effectiveExcluded) {
      const session = sessions[idx];
      if (session && !session.alreadyExists) return true;
    }
    return false;
  }, [overrides, effectiveExcluded, sessions]);

  const clashCount = useMemo(
    () => sessions.filter((s) => s.hasRoomClash).length,
    [sessions]
  );

  const duplicateCount = useMemo(
    () => sessions.filter((s) => s.alreadyExists).length,
    [sessions]
  );

  const selectedCount = useMemo(
    () => sessions.filter((_s, idx) => !effectiveExcluded.has(idx)).length,
    [sessions, effectiveExcluded]
  );

  // Initialize exclusion set when sessions change: auto-exclude duplicates only.
  const initExclusions = useCallback((sessionList: SessionPreview[]) => {
    const excluded = new Set<number>();
    sessionList.forEach((s, idx) => {
      if (s.alreadyExists) excluded.add(idx);
    });
    return excluded;
  }, []);

  // Grid data with row index. The array position (_idx) is the contract the
  // backend uses for excludedIndices/sessionOverrides, so it must stay tied to
  // the original dry-run order. We only reorder the *display* chronologically —
  // otherwise multiple schedules render grouped-by-schedule instead of merged
  // by date — while keeping each row's original _idx.
  const gridData = useMemo<SessionRow[]>(
    () =>
      sessions
        .map((s, idx) =>
          Object.assign(Object.create(Object.getPrototypeOf(s)), s, {
            _rowIdx: String(idx),
            _idx: idx,
          })
        )
        .sort((a, b) => {
          if (a.date !== b.date) return a.date < b.date ? -1 : 1;
          return (a.startTime || '').localeCompare(b.startTime || '');
        }),
    [sessions]
  );

  // Perform preview (dry run)
  const doPreview = useCallback(
    async (
      setExcluded: (s: Set<number>) => void,
      setPagination: (
        updater: (prev: { pageSize: number; pageIndex: number }) => {
          pageSize: number;
          pageIndex: number;
        }
      ) => void
    ) => {
      if (!therapyId) return;
      setLoading(true);
      clearOverrides();
      try {
        const result = await dryRunFn({
          therapyId,
          generateFrom: dateToYMD(startOfDay(generateFrom)),
          generateUntil: dateToYMD(endOfDay(generateUntil)),
        });
        const sessionList = result.sessions || [];
        setSessions(sessionList);
        setExcluded(initExclusions(sessionList));
        setHasFetched(true);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      therapyId,
      generateFrom,
      generateUntil,
      clearOverrides,
      dryRunFn,
      initExclusions,
    ]
  );

  // Fetch future sessions (unlock mode)
  const fetchFutureSessions = useCallback(async () => {
    if (!therapyId) return;
    setLoading(true);
    try {
      const result = await getFutureFn({ therapyId });
      setSessions(result.sessions || []);
      setHasFetched(true);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [therapyId, getFutureFn]);

  // Confirm generation or deletion
  const handleConfirm = useCallback(async () => {
    if (!therapyId) return;
    setConfirming(true);
    try {
      if (mode === 'generate') {
        const excludedArr = Array.from(effectiveExcluded);
        const sessionOverrides: SessionOverride[] = [];
        for (const [key, ovr] of Object.entries(overrides)) {
          const idx = parseInt(key, 10);
          if (effectiveExcluded.has(idx)) continue;
          sessionOverrides.push(
            new SessionOverride({
              index: idx,
              date: ovr.date,
              startTime: ovr.startTime,
              endTime: ovr.endTime,
              roomId: ovr.roomId,
              isOnline: ovr.isOnline,
            })
          );
        }
        const result = await generateFn({
          therapyId,
          generateFrom: dateToYMD(startOfDay(generateFrom)),
          generateUntil: dateToYMD(endOfDay(generateUntil)),
          excludedIndices: excludedArr,
          sessionOverrides,
        });
        toast.success(
          t('{{count}} session(s) generated successfully', {
            count: result.generatedCount,
          })
        );
      } else {
        if (sessions.length > 0) {
          const result = await deleteFutureFn({ therapyId });
          toast.success(
            t('{{count}} future session(s) deleted', {
              count: result.deletedCount,
            })
          );
        }
      }
      // Invalidate the therapy get cache so any open form refetches the
      // updated sessionsGeneratedAt/till and recomputes the lock window.
      queryClient.invalidateQueries({
        queryKey: createConnectQueryKey(getTherapy, { ID: therapyId } as never),
      });
      dispatchRpgWindowEvent('rpg:window:saved', {
        windowId: 'session-generate-preview',
        formName: 'SessionForm',
        title: 'Session',
        data: { therapyId },
      });
      afterSave?.();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setConfirming(false);
    }
  }, [
    therapyId,
    mode,
    effectiveExcluded,
    overrides,
    generateFrom,
    generateUntil,
    generateFn,
    deleteFutureFn,
    sessions.length,
    afterSave,
    t,
  ]);

  // From date handler
  const handleFromChange = useCallback(
    (val: Date | null) => {
      if (!val) return;
      setGenerateFrom(val);
      const maxUntil = getMaxUntilDate(val);
      if (generateUntil > maxUntil) {
        setGenerateUntil(maxUntil);
      }
    },
    [generateUntil]
  );

  // Until date handler
  const handleUntilChange = useCallback((val: Date | null) => {
    if (val) setGenerateUntil(val);
  }, []);

  // Quick select until
  const handleQuickSelectUntil = useCallback(
    (months: number) => {
      const d = new Date(generateFrom);
      d.setMonth(d.getMonth() + months);
      const max = getMaxUntilDate(generateFrom);
      setGenerateUntil(d > max ? max : d);
    },
    [generateFrom]
  );

  // Fetch last session date and set the "from" date accordingly
  const fetchLastSessionDate = useCallback(async () => {
    if (!therapyId) return;
    try {
      const result = await getLastSessionDateFn({ therapyId });
      if (result.lastSessionDate) {
        const lastDate = new Date(`${result.lastSessionDate}T00:00`);
        // Set "from" to the day after the last session
        const nextDay = new Date(lastDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setGenerateFrom(startOfDay(nextDay));
        // Adjust "until" if it's now before "from"
        const maxUntil = getMaxUntilDate(nextDay);
        if (generateUntil < nextDay) {
          setGenerateUntil(getDefaultUntilDate());
        } else if (generateUntil > maxUntil) {
          setGenerateUntil(maxUntil);
        }
      } else {
        toast(t('No existing sessions found for this therapy'));
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }, [therapyId, getLastSessionDateFn, generateUntil, t]);

  return {
    sessions,
    loading,
    confirming,
    hasFetched,
    generateFrom,
    generateUntil,
    confirmDialogOpen,
    setConfirmDialogOpen,
    hasEdits,
    clashCount,
    duplicateCount,
    selectedCount,
    gridData,
    doPreview,
    fetchFutureSessions,
    handleConfirm,
    handleFromChange,
    handleUntilChange,
    handleQuickSelectUntil,
    fetchLastSessionDate,
  };
}
