import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import { WhereOperator } from '@gen/request/v1/base_pb';
import FilterAdornment from '~/_lib/grid/filter/filter-adornment';
import useFilter from '~/_lib/grid/hooks/use-filter';
import IconButton from '@mui/material/IconButton';
import { IconXCircle } from '~/components/icon';
import dayjs from 'dayjs';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'next-i18next';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useLocaleDateFormat } from '~/utils/locale';

dayjs.extend(isoWeek);

type DateFilterOperator =
  | WhereOperator.GT
  | WhereOperator.GTE
  | WhereOperator.LT
  | WhereOperator.LTE;

export interface DateFilterProps {
  id: string;
  label: string;
  defaultOperator?: DateFilterOperator;
  operators?: DateFilterOperator[];
  disabled?: boolean;
  timeAdjustment?: 'start' | 'end';
  /**
   * When true, send the value as a YYYY-MM-DD date string instead of a
   * Unix-ms timestamp. Use this for columns backed by PostgreSQL DATE type.
   */
  sendAsDateString?: boolean;
}

const DateFilter: React.FC<DateFilterProps> = (props) => {
  const {
    id,
    label,
    defaultOperator = WhereOperator.GTE,
    operators = [
      WhereOperator.GT,
      WhereOperator.GTE,
      WhereOperator.LT,
      WhereOperator.LTE,
    ],
    disabled,
    timeAdjustment,
    sendAsDateString,
  } = props;

  const { t } = useTranslation('common');
  const dateFormat = useLocaleDateFormat();

  const [contextMenu, setContextMenu] = useState<{
    event: React.MouseEvent<HTMLInputElement> | null;
    mouseX: number;
    mouseY: number;
  }>({ event: null, mouseX: 0, mouseY: 0 });
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);

  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      event.preventDefault();
      setContextMenu({
        event,
        mouseX: event.clientX,
        mouseY: event.clientY,
      });
    },
    []
  );

  const handleOpenMoreMenu = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      setMoreAnchorEl(event.currentTarget);
    },
    []
  );

  const handleCloseContextMenu = React.useCallback(() => {
    setContextMenu({ event: null, mouseX: 0, mouseY: 0 });
    setMoreAnchorEl(null);
  }, []);

  const { value, removeFilter, setValue, setOperator, operator } = useFilter<
    string | number | ''
  >({
    id,
    defaultValue: '',
    defaultOperator: defaultOperator,
  });

  const [localOperator, setLocalOperator] =
    React.useState<WhereOperator>(operator);

  // Convert string/number to Date for the DatePicker
  const dateValue = (() => {
    if (!value) return null;
    if (sendAsDateString && typeof value === 'string') {
      // value is YYYY-MM-DD — parse as local date
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(Number(value));
  })();

  /** Format a Date as YYYY-MM-DD. */
  const toDateString = React.useCallback((d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const handleDateChange = React.useCallback(
    (newValue: Date | null) => {
      if (newValue) {
        if (sendAsDateString) {
          setValue(toDateString(newValue), localOperator);
        } else {
          let timestamp = new Date(newValue).getTime();
          if (timeAdjustment === 'end') {
            timestamp = dayjs(newValue).endOf('day').valueOf();
          }
          setValue(timestamp, localOperator);
        }
      } else {
        setValue('', localOperator);
      }
    },
    [sendAsDateString, toDateString, timeAdjustment, setValue, localOperator]
  );

  const handleOperatorChange = React.useCallback(
    (newOperator: WhereOperator) => {
      setLocalOperator(newOperator);
      setOperator(newOperator);
    },
    [setLocalOperator, setOperator]
  );

  const handleSetWeek = React.useCallback(
    (direction: 'current' | 'next' | 'previous') => {
      let targetDate: dayjs.Dayjs;

      if (direction === 'next') {
        targetDate = value
          ? dayjs(sendAsDateString ? value : Number(value)).add(1, 'week')
          : dayjs().add(1, 'week');
      } else if (direction === 'previous') {
        targetDate = value
          ? dayjs(sendAsDateString ? value : Number(value)).subtract(1, 'week')
          : dayjs().subtract(1, 'week');
      } else {
        // In case "current", also reset the operator to the default operator
        setLocalOperator(defaultOperator);
        targetDate = dayjs();
      }

      if (sendAsDateString) {
        const target =
          timeAdjustment === 'end'
            ? targetDate.endOf('isoWeek')
            : targetDate.startOf('isoWeek');
        setValue(toDateString(target.toDate()), localOperator);
      } else if (timeAdjustment === 'end') {
        const endOfTarget = targetDate.endOf('isoWeek').endOf('day');
        setValue(endOfTarget.valueOf(), localOperator);
      } else {
        const startOfTarget = targetDate.startOf('isoWeek').startOf('day');
        setValue(startOfTarget.valueOf(), localOperator);
      }
      handleCloseContextMenu();
    },
    [
      sendAsDateString,
      toDateString,
      timeAdjustment,
      setValue,
      localOperator,
      handleCloseContextMenu,
      defaultOperator,
      value,
    ]
  );

  const handleSetDay = React.useCallback(
    (direction: 'today' | 'next' | 'previous') => {
      let targetDate: dayjs.Dayjs;

      if (direction === 'next') {
        targetDate = value
          ? dayjs(sendAsDateString ? value : Number(value)).add(1, 'day')
          : dayjs().add(1, 'day');
      } else if (direction === 'previous') {
        targetDate = value
          ? dayjs(sendAsDateString ? value : Number(value)).subtract(1, 'day')
          : dayjs().subtract(1, 'day');
      } else {
        targetDate = dayjs();
      }

      if (sendAsDateString) {
        setValue(toDateString(targetDate.toDate()), localOperator);
      } else if (timeAdjustment === 'end') {
        const endOfDay = targetDate.endOf('day');
        setValue(endOfDay.valueOf(), localOperator);
      } else {
        const startOfDay = targetDate.startOf('day');
        setValue(startOfDay.valueOf(), localOperator);
      }
      handleCloseContextMenu();
    },
    [
      timeAdjustment,
      setValue,
      localOperator,
      handleCloseContextMenu,
      sendAsDateString,
      toDateString,
      value,
    ]
  );

  const handleClearFilter = React.useCallback(() => {
    removeFilter();
  }, [removeFilter]);

  const hasValue = React.useMemo(
    () => value !== '' && value !== undefined && value !== null,
    [value]
  );

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <DatePicker
          label={label}
          value={dateValue}
          onChange={handleDateChange}
          disabled={disabled}
          format={dateFormat}
          slotProps={{
            textField: (params) => ({
              id: id,
              fullWidth: true,
              inputProps: {
                'data-testid': id,
                onContextMenu: handleContextMenu,
              },
              InputProps: {
                startAdornment: (
                  <FilterAdornment
                    operator={localOperator ?? defaultOperator}
                    onOperatorChange={handleOperatorChange}
                    operators={operators}
                  />
                ),
                endAdornment: (
                  <>
                    {params.InputProps?.endAdornment}
                    {hasValue && !disabled && (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label="Clear filter"
                          onClick={handleClearFilter}
                          onMouseDown={(e) => e.preventDefault()}
                          sx={{
                            p: 0,
                            m: 0,
                          }}
                        >
                          <IconXCircle />
                        </IconButton>
                      </InputAdornment>
                    )}
                  </>
                ),
              },
            }),
          }}
        />
        <IconButton
          aria-label="Quick select"
          onClick={handleOpenMoreMenu}
          sx={{
            p: 0,
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>
      <Menu
        open={contextMenu.event !== null || moreAnchorEl !== null}
        onClose={handleCloseContextMenu}
        anchorReference={moreAnchorEl !== null ? 'anchorEl' : 'anchorPosition'}
        anchorEl={moreAnchorEl}
        anchorPosition={
          contextMenu.event !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => handleSetDay('today')}>{t('Today')}</MenuItem>
        <MenuItem onClick={() => handleSetDay('previous')}>
          {t('Previous day')}
        </MenuItem>
        <MenuItem onClick={() => handleSetDay('next')}>
          {t('Next day')}
        </MenuItem>
        <MenuItem onClick={() => handleSetWeek('previous')}>
          {t('Previous week')}
        </MenuItem>
        <MenuItem onClick={() => handleSetWeek('current')}>
          {t('Current week')}
        </MenuItem>
        <MenuItem onClick={() => handleSetWeek('next')}>
          {t('Next week')}
        </MenuItem>
      </Menu>
    </>
  );
};

export default DateFilter;
