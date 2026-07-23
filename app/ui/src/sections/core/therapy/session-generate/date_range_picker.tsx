import React, { useState } from 'react';
import {
  Stack,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'next-i18next';

import { getMaxUntilDate } from './utils';

interface DateRangePickerProps {
  generateFrom: Date;
  generateUntil: Date;
  onFromChange: (val: Date | null) => void;
  onUntilChange: (val: Date | null) => void;
  onQuickSelect: (months: number) => void;
  onLastSession?: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  generateFrom,
  generateUntil,
  onFromChange,
  onUntilChange,
  onQuickSelect,
  onLastSession,
}) => {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <DatePicker
        label={t('From')}
        value={generateFrom}
        format="dd/MM/yyyy"
        onChange={onFromChange}
        slotProps={{
          textField: {
            size: 'small',
            sx: { minWidth: 160 },
            inputProps: { 'data-testid': 'session-generate-from-input' },
            InputProps: onLastSession
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={t('Set to day after last existing session')}
                      >
                        <IconButton
                          size="small"
                          onClick={onLastSession}
                          data-testid="session-generate-last-session-btn"
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }
              : undefined,
          },
        }}
      />
      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', px: 0.5 }}>→</Typography>
      <DatePicker
        label={t('Until')}
        value={generateUntil}
        format="dd/MM/yyyy"
        onChange={onUntilChange}
        minDate={generateFrom}
        maxDate={getMaxUntilDate(generateFrom)}
        slotProps={{
          textField: {
            size: 'small',
            sx: { minWidth: 160 },
            inputProps: { 'data-testid': 'session-generate-until-input' },
            InputProps: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    data-testid="session-generate-quick-select-btn"
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          },
        }}
      />
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            onQuickSelect(1);
            setMenuAnchor(null);
          }}
        >
          {t('1 month')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onQuickSelect(2);
            setMenuAnchor(null);
          }}
        >
          {t('2 months')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onQuickSelect(3);
            setMenuAnchor(null);
          }}
        >
          {t('3 months')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onQuickSelect(6);
            setMenuAnchor(null);
          }}
        >
          {t('6 months')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onQuickSelect(12);
            setMenuAnchor(null);
          }}
        >
          {t('12 months')}
        </MenuItem>
      </Menu>
    </Stack>
  );
};
