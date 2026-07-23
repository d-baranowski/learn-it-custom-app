import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Stack,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import WifiOutlinedIcon from '@mui/icons-material/WifiOutlined';
import { useTranslation } from 'next-i18next';

import type { SessionRow, OverrideState } from './types';
import { formatSessionDate, parseTranslatedLabel } from './utils';

interface SessionListProps {
  sessions: SessionRow[];
  excludedIndices: Set<number>;
  toggleExclude: (idx: number) => void;
  overrides: Record<string, OverrideState>;
  getEffectiveDate: (idx: number, row: SessionRow) => string;
  getEffectiveStartTime: (idx: number, row: SessionRow) => string;
  getEffectiveEndTime: (idx: number, row: SessionRow) => string;
  getEffectiveRoomId: (idx: number, row: SessionRow) => string | undefined;
  getEffectiveOnline: (idx: number, row: SessionRow) => boolean;
  onOverride: (idx: number) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  excludedIndices,
  toggleExclude,
  overrides,
  getEffectiveDate,
  getEffectiveStartTime,
  getEffectiveEndTime,
  getEffectiveRoomId,
  getEffectiveOnline,
  onOverride,
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const total = sessions.length;

  return (
    <Box
      data-testid="session-generate-preview-table"
      sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 1 }}
    >
      {sessions.map((session, i) => {
        const idx = session._idx;
        const excluded = excludedIndices.has(idx);
        const isDuplicate = session.alreadyExists;
        const ovr = overrides[String(idx)];
        const isOverridden = !!ovr && Object.keys(ovr).length > 0;

        const effDate = getEffectiveDate(idx, session);
        const effStart = getEffectiveStartTime(idx, session);
        const effEnd = getEffectiveEndTime(idx, session);
        const effRoomId = getEffectiveRoomId(idx, session);
        const effOnline = getEffectiveOnline(idx, session);

        const dateChanged = isOverridden && effDate !== session.date;
        const timeChanged = isOverridden && (effStart !== session.startTime || effEnd !== session.endTime);
        const roomChanged = isOverridden && (effRoomId !== session.roomId || effOnline !== session.isOnline);

        const roomLabel = effOnline
          ? t('Online')
          : parseTranslatedLabel(session.roomLabel || undefined, locale);

        return (
          <Box
            key={session._rowIdx}
            data-testid="session-row"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 1.25,
              px: 0.75,
              borderRadius: 1,
              borderTop: i > 0 ? '1px solid' : 'none',
              borderColor: 'divider',
              ...(isOverridden && {
                backgroundColor: '#F4F1F9',
              }),
              ...(excluded && { opacity: 0.4 }),
              ...(isDuplicate && { opacity: 0.45 }),
            }}
          >
            <Checkbox
              checked={!excluded}
              disabled={isDuplicate}
              onChange={() => toggleExclude(idx)}
              size="small"
              sx={{
                flexShrink: 0,
                color: '#534AB7',
                '&.Mui-checked': { color: '#534AB7' },
              }}
            />

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.75 }}>
              {/* Date block */}
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  {formatSessionDate(effDate, locale)}
                </Typography>
                <Typography variant="caption" sx={{
                  color: isOverridden ? '#534AB7' : 'text.secondary',
                  fontSize: '0.6875rem',
                }}>
                  {isDuplicate
                    ? t('already exists')
                    : isOverridden
                    ? t('Session {{n}} of {{total}} · overridden', { n: i + 1, total })
                    : t('Session {{n}} of {{total}}', { n: i + 1, total })}
                </Typography>
              </Box>

              {/* Time range */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {timeChanged && (
                  <Typography variant="body2" sx={{
                    textDecoration: 'line-through',
                    opacity: 0.5,
                    fontSize: '0.8125rem',
                    color: 'text.secondary',
                  }}>
                    {session.startTime} – {session.endTime}
                  </Typography>
                )}
                <Typography variant="body2" sx={{
                  fontSize: '0.8125rem',
                  fontWeight: timeChanged ? 500 : 400,
                  color: timeChanged ? 'text.primary' : 'text.secondary',
                }}>
                  {effStart} – {effEnd}
                </Typography>
              </Box>

              {/* Room / Online */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.8125rem',
                fontWeight: roomChanged ? 500 : 400,
                color: roomChanged ? 'text.primary' : 'text.secondary',
              }}>
                {effOnline
                  ? <WifiOutlinedIcon sx={{ fontSize: 14 }} />
                  : <HomeWorkOutlinedIcon sx={{ fontSize: 14 }} />}
                <Typography variant="body2" sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 'inherit',
                  color: 'inherit',
                }}>
                  {roomLabel}
                </Typography>
              </Box>
            </Box>

            {/* Override / Edit button */}
            {!isDuplicate && !excluded && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onOverride(idx)}
                startIcon={<EditOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                sx={{
                  flexShrink: 0,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                  borderColor: isOverridden ? '#534AB7' : 'divider',
                  color: isOverridden ? '#534AB7' : 'text.secondary',
                }}
              >
                {t('Edit')}
              </Button>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
