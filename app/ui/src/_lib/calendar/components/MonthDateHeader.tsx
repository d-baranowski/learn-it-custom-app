import React from 'react';
import moment from 'moment';
import { Box } from '@mui/material';
import { useResourceDataContext } from '~/_lib/calendar/components/ResourceDataContext';
import { dayKey } from '~/_lib/calendar/utils/day-key';

interface MonthDateHeaderProps {
  label: string;
  date: Date;
  isOffRange?: boolean;
  onDrillDown?: (e: React.MouseEvent) => void;
}

const COUNT_BADGE_MIN = 3;

export function MonthDateHeader({
  label,
  date,
  isOffRange,
  onDrillDown,
}: MonthDateHeaderProps) {
  const { monthDayEventCounts } = useResourceDataContext();
  const isToday = moment(date).isSame(moment(), 'day');
  const count = monthDayEventCounts.get(dayKey(date)) ?? 0;

  return (
    <Box
      className="rpg-month-date-header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onDrillDown}
        className="rpg-month-day-number"
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 24,
          height: 24,
          px: 0.75,
          borderRadius: '999px',
          fontWeight: isToday ? 700 : 500,
          color: isToday ? '#fff' : isOffRange ? 'text.disabled' : 'text.primary',
          backgroundColor: isToday ? 'primary.main' : 'transparent',
        }}
      >
        {label}
      </Box>
      {count >= COUNT_BADGE_MIN && (
        <Box
          component="span"
          className="rpg-month-day-count"
          sx={{
            minWidth: 20,
            height: 20,
            px: 0.5,
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.secondary',
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );
}
