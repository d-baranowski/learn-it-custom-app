import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import { WhereOperator } from '@gen/request/v1/base_pb';
import useFilter from '~/_lib/grid/hooks/use-filter';
import IconButton from '@mui/material/IconButton';
import { IconXCircle } from '~/components/icon';
import dayjs from 'dayjs';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'next-i18next';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useLocaleDateFormat } from '~/utils/locale';

dayjs.extend(isoWeek);

export interface DateRangeFilterProps {
  id: string;
  label: string;
  disabled?: boolean;
}

/** Format a Date as YYYY-MM-DD. */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date.
 * Returns null if the string is falsy.
 */
function parseDateString(s: string | undefined | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * DateRangeFilter renders two DatePicker inputs (From / To) and dispatches
 * a single Redux filter:
 *
 * - Both filled  -> BETWEEN [from, to]
 * - Only "from"  -> GTE from
 * - Only "to"    -> LTE to
 * - Neither      -> filter removed
 *
 * Values are sent as YYYY-MM-DD strings (for PostgreSQL DATE columns).
 * A kebab menu provides quick-range shortcuts (today, current week, etc.).
 */
const DateRangeFilter: React.FC<DateRangeFilterProps> = (props) => {
  const { id, label, disabled } = props;
  const { t } = useTranslation('common');
  const dateFormat = useLocaleDateFormat();

  // ── Redux filter state ────────────────────────────────────────────────────
  const { value, removeFilter, setValue } = useFilter<string | string[] | ''>({
    id,
    defaultValue: '',
    defaultOperator: WhereOperator.BETWEEN,
  });

  // ── Derive local from/to from Redux value ─────────────────────────────────
  const [fromDate, toDate] = React.useMemo<[Date | null, Date | null]>(() => {
    if (Array.isArray(value) && value.length === 2) {
      return [parseDateString(value[0]), parseDateString(value[1])];
    }
    if (typeof value === 'string' && value) {
      // Legacy single-value filter (GTE or LTE) — treat as "from"
      return [parseDateString(value), null];
    }
    return [null, null];
  }, [value]);

  // ── Kebab menu state ──────────────────────────────────────────────────────
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      setMenuAnchor(e.currentTarget);
    },
    []
  );

  const handleCloseMenu = React.useCallback(() => {
    setMenuAnchor(null);
  }, []);

  // ── Dispatch helpers ──────────────────────────────────────────────────────
  const dispatchRange = React.useCallback(
    (from: Date | null, to: Date | null) => {
      if (from && to) {
        setValue([toDateString(from), toDateString(to)], WhereOperator.BETWEEN);
      } else if (from) {
        setValue(toDateString(from), WhereOperator.GTE);
      } else if (to) {
        setValue(toDateString(to), WhereOperator.LTE);
      } else {
        removeFilter();
      }
    },
    [setValue, removeFilter]
  );

  // ── Date change handlers ──────────────────────────────────────────────────
  const handleFromChange = React.useCallback(
    (newValue: Date | null) => {
      dispatchRange(newValue, toDate);
    },
    [toDate, dispatchRange]
  );

  const handleToChange = React.useCallback(
    (newValue: Date | null) => {
      dispatchRange(fromDate, newValue);
    },
    [fromDate, dispatchRange]
  );

  // ── Clear all ─────────────────────────────────────────────────────────────
  const handleClear = React.useCallback(() => {
    removeFilter();
  }, [removeFilter]);

  const hasValue = React.useMemo(
    () => fromDate !== null || toDate !== null,
    [fromDate, toDate]
  );

  // ── Quick range presets ───────────────────────────────────────────────────
  const applyPreset = React.useCallback(
    (from: dayjs.Dayjs, to: dayjs.Dayjs) => {
      dispatchRange(from.toDate(), to.toDate());
      handleCloseMenu();
    },
    [dispatchRange, handleCloseMenu]
  );

  const presetToday = React.useCallback(() => {
    const d = dayjs();
    applyPreset(d.startOf('day'), d.endOf('day'));
  }, [applyPreset]);

  const presetCurrentWeek = React.useCallback(() => {
    const d = dayjs();
    applyPreset(d.startOf('isoWeek'), d.endOf('isoWeek'));
  }, [applyPreset]);

  const presetNextWeek = React.useCallback(() => {
    const d = dayjs().add(1, 'week');
    applyPreset(d.startOf('isoWeek'), d.endOf('isoWeek'));
  }, [applyPreset]);

  const presetPreviousWeek = React.useCallback(() => {
    const d = dayjs().subtract(1, 'week');
    applyPreset(d.startOf('isoWeek'), d.endOf('isoWeek'));
  }, [applyPreset]);

  const presetCurrentMonth = React.useCallback(() => {
    const d = dayjs();
    applyPreset(d.startOf('month'), d.endOf('month'));
  }, [applyPreset]);

  const presetNextMonth = React.useCallback(() => {
    const d = dayjs().add(1, 'month');
    applyPreset(d.startOf('month'), d.endOf('month'));
  }, [applyPreset]);

  const presetPreviousMonth = React.useCallback(() => {
    const d = dayjs().subtract(1, 'month');
    applyPreset(d.startOf('month'), d.endOf('month'));
  }, [applyPreset]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <DatePicker
          label={t('From')}
          value={fromDate}
          onChange={handleFromChange}
          disabled={disabled}
          format={dateFormat}
          slotProps={{
            textField: () => ({
              fullWidth: true,
              size: 'small' as const,
              inputProps: { 'data-testid': `${id}-from` },
              InputProps: {
                endAdornment: undefined,
              },
              InputLabelProps: {
                shrink: true,
              },
              sx: { minWidth: 145 },
            }),
          }}
        />
        <DatePicker
          label={t('To')}
          value={toDate}
          onChange={handleToChange}
          disabled={disabled}
          format={dateFormat}
          slotProps={{
            textField: () => ({
              fullWidth: true,
              size: 'small' as const,
              inputProps: { 'data-testid': `${id}-to` },
              InputProps: {
                endAdornment: undefined,
              },
              InputLabelProps: {
                shrink: true,
              },
              sx: { minWidth: 145 },
            }),
          }}
        />
        {hasValue && !disabled && (
          <IconButton
            edge="end"
            aria-label="Clear filter"
            onClick={handleClear}
            onMouseDown={(e) => e.preventDefault()}
            sx={{ p: 0 }}
          >
            <IconXCircle />
          </IconButton>
        )}
        <IconButton
          aria-label="Quick select"
          onClick={handleOpenMenu}
          sx={{ p: 0, ml: 0.5 }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Menu
        open={menuAnchor !== null}
        onClose={handleCloseMenu}
        anchorEl={menuAnchor}
      >
        <MenuItem data-testid="date-preset-today" onClick={presetToday}>{t('Today')}</MenuItem>
        <ListSubheader>{t('Week')}</ListSubheader>
        <MenuItem data-testid="date-preset-previous-week" onClick={presetPreviousWeek}>{t('Previous week')}</MenuItem>
        <MenuItem data-testid="date-preset-current-week" onClick={presetCurrentWeek}>{t('Current week')}</MenuItem>
        <MenuItem data-testid="date-preset-next-week" onClick={presetNextWeek}>{t('Next week')}</MenuItem>
        <ListSubheader>{t('Month')}</ListSubheader>
        <MenuItem data-testid="date-preset-previous-month" onClick={presetPreviousMonth}>{t('Previous month')}</MenuItem>
        <MenuItem data-testid="date-preset-current-month" onClick={presetCurrentMonth}>{t('Current month')}</MenuItem>
        <MenuItem data-testid="date-preset-next-month" onClick={presetNextMonth}>{t('Next month')}</MenuItem>
      </Menu>
    </>
  );
};

export default DateRangeFilter;
