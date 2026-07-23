import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

import { useWindowActions } from '~/_lib/window/state/hooks';
import type { Session } from '@gen/core/v1/session_pb';

import type { SessionGeneratePreviewProps } from './types';
import { useSessionOverrides } from './use_session_overrides';
import { useSessionPreview } from './use_session_preview';
import { DateRangePicker } from './date_range_picker';
import { SessionList } from './session_list';
import { setOverrideSubmitHandler } from './override_submit_store';
import { formatRangeDate } from './utils';

export const SessionGeneratePreview: React.FC<SessionGeneratePreviewProps> = (
  props
) => {
  const {
    therapyId,
    mode = 'generate',
    onCancel,
    afterSave,
    therapistLabel,
    serviceLabel,
    frequencySummary,
  } = props;
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const { openWindow, closeWindow } = useWindowActions();

  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(
    new Set()
  );

  const toggleExclude = useCallback((idx: number) => {
    setExcludedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const {
    overrides,
    setOverrideField,
    clearOverrides,
    getEffectiveDate,
    getEffectiveStartTime,
    getEffectiveEndTime,
    getEffectiveRoomId,
    getEffectiveOnline,
  } = useSessionOverrides();

  const {
    sessions,
    loading,
    confirming,
    hasFetched,
    generateFrom,
    generateUntil,
    confirmDialogOpen: _confirmDialogOpen,
    setConfirmDialogOpen: _setConfirmDialogOpen,
    hasEdits: _hasEdits,
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
  } = useSessionPreview({
    therapyId,
    mode,
    overrides,
    excludedIndices,
    clearOverrides,
    afterSave,
  });

  useEffect(() => {
    if (mode === 'unlock' && therapyId) {
      fetchFutureSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapyId, mode]);

  // Auto-preview on mount and whenever date range changes
  useEffect(() => {
    if (mode === 'generate' && therapyId) {
      doPreview(setExcludedIndices, () => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapyId, mode, generateFrom.getTime(), generateUntil.getTime()]);

  const handleOverride = useCallback(
    (idx: number) => {
      const session = gridData.find((s) => s._idx === idx);
      if (!session) return;

      const windowId = `session-override-${idx}`;

      setOverrideSubmitHandler(windowId, async (values) => {
        if (values.date) setOverrideField(idx, 'date', values.date as string);
        if (values.startTime) setOverrideField(idx, 'startTime', values.startTime as string);
        if (values.endTime) setOverrideField(idx, 'endTime', values.endTime as string);
        if (values.roomId !== undefined) setOverrideField(idx, 'roomId', values.roomId as string);
        if (values.isOnline !== undefined) setOverrideField(idx, 'isOnline', values.isOnline as boolean);
        closeWindow(windowId);
        return { id: windowId } as unknown as Session;
      });

      const effDate = getEffectiveDate(idx, session);
      const effStart = getEffectiveStartTime(idx, session);
      const effEnd = getEffectiveEndTime(idx, session);
      const effRoomId = getEffectiveRoomId(idx, session);
      const effOnline = getEffectiveOnline(idx, session);

      openWindow({
        formName: 'SessionForm',
        title: t('Edit session'),
        windowId,
        maxWidth: 'md',
        formProps: {
          defaultValues: {
            therapyId,
            date: effDate,
            startTime: effStart,
            endTime: effEnd,
            roomId: effRoomId,
            isOnline: effOnline,
          },
        },
      });
    },
    [
      gridData, therapyId, openWindow, closeWindow, t,
      setOverrideField, getEffectiveDate, getEffectiveStartTime,
      getEffectiveEndTime, getEffectiveRoomId, getEffectiveOnline,
    ]
  );

  const handleSkipAll = useCallback(() => {
    setExcludedIndices(new Set(sessions.map((_, i) => i)));
  }, [sessions]);

  const subtitle = [therapistLabel, serviceLabel, frequencySummary]
    .filter(Boolean)
    .join(' · ');

  return (
    <Stack spacing={1.5} data-testid="session-generate-preview" sx={{ height: '100%', minHeight: 0 }}>
      {/* Header context */}
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem', pb: 0.5 }}>
          {subtitle}
        </Typography>
      )}

      {/* Date range */}
      {mode === 'generate' && (
        <>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DateRangePicker
              generateFrom={generateFrom}
              generateUntil={generateUntil}
              onFromChange={handleFromChange}
              onUntilChange={handleUntilChange}
              onQuickSelect={handleQuickSelectUntil}
              onLastSession={fetchLastSessionDate}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {t('≈ {{count}} weeks', { count: Math.round((generateUntil.getTime() - generateFrom.getTime()) / (7 * 24 * 60 * 60 * 1000)) })}
            </Typography>
          </Stack>
        </>
      )}

      {mode === 'unlock' && (
        <Alert severity="warning" data-testid="session-generate-unlock-warning" sx={{ mx: 1 }}>
          {t(
            'All future generated sessions will be deleted. You will need to regenerate sessions manually after modifying the frequency.'
          )}
        </Alert>
      )}

      {/* Summary line */}
      {hasFetched && sessions.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 1.5,
            pb: 0.75,
            px: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 1,
          }}
          data-testid="session-generate-summary-text"
        >
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {mode === 'generate' ? (
              <>
                <Box component="span" sx={{ fontWeight: 500 }}>
                  {t('{{count}} sessions will be created', { count: selectedCount })}.
                </Box>
                {' '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {t('Times come from the therapy schedule; override any row if needed.')}
                </Box>
              </>
            ) : (
              <Box component="span" sx={{ fontWeight: 500 }}>
                {t('The following {{count}} session(s) will be deleted:', { count: sessions.length })}
              </Box>
            )}
          </Typography>
          {mode === 'generate' && (
            <Link
              component="button"
              variant="body2"
              onClick={handleSkipAll}
              sx={{ fontSize: '0.75rem', flexShrink: 0, ml: 2 }}
            >
              {t('Skip all')}
            </Link>
          )}
        </Box>
      )}

      {hasFetched && sessions.length === 0 && (
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}
          data-testid="session-generate-no-sessions-msg"
        >
          {t('No sessions to generate in this date range.')}
        </Typography>
      )}

      {/* Session list */}
      <SessionList
        sessions={gridData}
        excludedIndices={excludedIndices}
        toggleExclude={toggleExclude}
        overrides={overrides}
        getEffectiveDate={getEffectiveDate}
        getEffectiveStartTime={getEffectiveStartTime}
        getEffectiveEndTime={getEffectiveEndTime}
        getEffectiveRoomId={getEffectiveRoomId}
        getEffectiveOnline={getEffectiveOnline}
        onOverride={handleOverride}
      />

      {/* Footer */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        {duplicateCount > 0 && (
          <Alert severity="info" sx={{ py: 0, flex: 1, fontSize: '0.75rem' }} data-testid="session-generate-duplicate-alert">
            {t('{{count}} session(s) already exist and will be skipped.', { count: duplicateCount })}
          </Alert>
        )}
        {clashCount > 0 && (
          <Alert severity="warning" sx={{ py: 0, flex: 1, fontSize: '0.75rem' }} data-testid="session-generate-clash-alert">
            {t('{{count}} session(s) have room clashes. Override the room to resolve.', { count: clashCount })}
          </Alert>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onCancel} data-testid="session-generate-cancel-btn">
          {t('Cancel')}
        </Button>
        {(mode === 'unlock' || hasFetched) && (
          <Button
            variant="contained"
            color={mode === 'generate' ? 'primary' : 'error'}
            onClick={handleConfirm}
            disabled={
              confirming || (mode === 'generate' && selectedCount === 0)
            }
            data-testid="session-generate-confirm-btn"
          >
            {confirming
              ? t('Processing...')
              : mode === 'generate'
              ? t('Generate {{count}} sessions', { count: selectedCount })
              : t('Delete & Unlock')}
          </Button>
        )}
      </Stack>

    </Stack>
  );
};
