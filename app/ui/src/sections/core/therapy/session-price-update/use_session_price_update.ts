import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@connectrpc/connect-query';
import {
  getSessionsForPriceUpdate,
  bulkUpdateSessionPrice,
} from '@gen/core/v1/session-SessionService_connectquery';
import type { SessionPriceUpdatePreview } from '@gen/core/v1/session_pb';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'next-i18next';

import type { PriceUpdateRow } from './types';

interface UseSessionPriceUpdateArgs {
  therapyIds: string[];
  defaultPrice?: string;
  afterSave?: (formData?: any) => void;
}

export function useSessionPriceUpdate({
  therapyIds,
  defaultPrice,
  afterSave,
}: UseSessionPriceUpdateArgs) {
  const { t } = useTranslation();

  const [sessions, setSessions] = useState<SessionPriceUpdatePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Date range state — "from" defaults to today, "until" is empty (infinity)
  const [fromDate, setFromDate] = useState<Date | null>(
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [untilDate, setUntilDate] = useState<Date | null>(null);

  // Excluded session IDs
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // New price
  const [newPrice, setNewPrice] = useState<string>(defaultPrice ?? '');

  const { mutateAsync: fetchSessionsFn } = useMutation(
    getSessionsForPriceUpdate
  );
  const { mutateAsync: bulkUpdateFn } = useMutation(bulkUpdateSessionPrice);

  // Counts
  const selectedCount = useMemo(
    () => sessions.filter((s) => !excludedIds.has(s.id)).length,
    [sessions, excludedIds]
  );

  // Grid data with row index
  const gridData = useMemo<PriceUpdateRow[]>(
    () =>
      sessions.map((s, idx) =>
        Object.assign(Object.create(Object.getPrototypeOf(s)), s, {
          _rowIdx: String(idx),
          _idx: idx,
        })
      ),
    [sessions]
  );

  // Format date to YYYY-MM-DD
  const dateToYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch sessions preview
  const doPreview = useCallback(async () => {
    if (therapyIds.length === 0) return;
    setLoading(true);
    try {
      const result = await fetchSessionsFn({
        therapyIds,
        dateFrom: fromDate ? dateToYMD(fromDate) : '',
        dateUntil: untilDate ? dateToYMD(untilDate) : '',
      });
      const sessionList = result.sessions || [];
      setSessions(sessionList);
      setExcludedIds(new Set());
      setHasFetched(true);

      // Auto-populate newPrice from therapy price when all sessions share the same value
      if (sessionList.length > 0) {
        const prices = new Set(
          sessionList.map((s) => s.therapyPrice).filter(Boolean)
        );
        if (prices.size === 1) {
          const commonPrice = [...prices][0];
          if (commonPrice && !newPrice) {
            setNewPrice(commonPrice);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [therapyIds, fromDate, untilDate, fetchSessionsFn, newPrice, setNewPrice]);

  // Toggle a single session exclusion
  const toggleExclude = useCallback((sessionId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  // Confirm bulk update
  const handleConfirm = useCallback(async () => {
    if (!newPrice || newPrice.trim() === '') {
      toast.error(t('Please enter a new price'));
      return;
    }
    const sessionIds = sessions
      .filter((s) => !excludedIds.has(s.id))
      .map((s) => s.id);
    if (sessionIds.length === 0) {
      toast.error(t('No sessions selected'));
      return;
    }
    setConfirming(true);
    try {
      const result = await bulkUpdateFn({
        sessionIds,
        price: newPrice.trim(),
      });
      toast.success(
        t('{{count}} session(s) updated successfully', {
          count: result.updatedCount,
        })
      );
      afterSave?.();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setConfirming(false);
    }
  }, [newPrice, sessions, excludedIds, bulkUpdateFn, afterSave, t]);

  // Date handlers
  const handleFromChange = useCallback((val: Date | null) => {
    setFromDate(val);
  }, []);

  const handleUntilChange = useCallback((val: Date | null) => {
    setUntilDate(val);
  }, []);

  return {
    sessions,
    loading,
    confirming,
    hasFetched,
    fromDate,
    untilDate,
    excludedIds,
    newPrice,
    setNewPrice,
    selectedCount,
    gridData,
    doPreview,
    toggleExclude,
    handleConfirm,
    handleFromChange,
    handleUntilChange,
  };
}
