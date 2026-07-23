import React from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

import type { PreviewMode } from './types';

interface PreviewAlertsProps {
  mode: PreviewMode;
  hasFetched: boolean;
  sessionCount: number;
  selectedCount: number;
  duplicateCount: number;
  clashCount: number;
}

export const PreviewAlerts: React.FC<PreviewAlertsProps> = ({
  mode,
  hasFetched,
  sessionCount,
  selectedCount,
  duplicateCount,
  clashCount,
}) => {
  const { t } = useTranslation();

  if (!hasFetched) return null;

  if (sessionCount === 0) {
    return (
      <Typography data-testid="session-generate-no-sessions-msg">
        {mode === 'generate'
          ? t('No sessions to generate.')
          : t('No future generated sessions found.')}
      </Typography>
    );
  }

  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography data-testid="session-generate-summary-text">
          {mode === 'generate'
            ? t(
                '{{count}} session(s) previewed, {{selected}} selected for generation.',
                { count: sessionCount, selected: selectedCount }
              )
            : t('The following {{count}} session(s) will be deleted:', {
                count: sessionCount,
              })}
        </Typography>
      </Stack>

      {mode === 'generate' && duplicateCount > 0 && (
        <Alert severity="info" data-testid="session-generate-duplicate-alert">
          {t(
            '{{count}} session(s) already exist and are excluded automatically.',
            { count: duplicateCount }
          )}
        </Alert>
      )}

      {mode === 'generate' && clashCount > 0 && (
        <Alert severity="warning" data-testid="session-generate-clash-alert">
          {t(
            '{{count}} session(s) have room clashes. You can change the room for each clashing session in the table below.',
            { count: clashCount }
          )}
        </Alert>
      )}
    </>
  );
};
