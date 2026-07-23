import React from 'react';
import { MenuItem, Select } from '@mui/material';
import { pillSx } from './pill-sx';

export interface PillSelectProps {
  value: number;
  options: { id: number; label: string }[];
  onChange: (id: number) => void;
  disabled?: boolean;
  formatLabel?: (label: string) => string;
  'data-testid'?: string;
}

export const PillSelect: React.FC<PillSelectProps> = ({ value, options, onChange, disabled, formatLabel = (l) => l.toLowerCase(), 'data-testid': testId }) => (
  <Select
    data-testid={testId}
    value={value}
    onChange={(e) => onChange(e.target.value as number)}
    disabled={disabled}
    variant="standard"
    disableUnderline
    sx={{
      ...pillSx,
      '& .MuiSelect-select': { p: 0, pr: '20px !important', fontSize: 14, fontWeight: 500 },
      '& .MuiSelect-icon': { color: 'text.secondary', fontSize: 18 },
    }}
  >
    {options.map((opt) => (
      <MenuItem key={opt.id} value={opt.id}>{formatLabel(opt.label)}</MenuItem>
    ))}
  </Select>
);
