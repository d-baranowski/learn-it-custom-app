import React from 'react';
import { Box, InputBase } from '@mui/material';
import { pillSx } from './pill-sx';

export interface PillNumberProps {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  'data-testid'?: string;
}

export const PillNumber: React.FC<PillNumberProps> = ({ value, onChange, disabled, min = 1, max = 99, 'data-testid': testId }) => (
  <Box sx={pillSx} data-testid={testId}>
    <InputBase
      type="number"
      value={value}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }}
      disabled={disabled}
      inputProps={{ min, max, style: { textAlign: 'center', width: 32, padding: 0 } }}
      sx={{ fontSize: 14, fontWeight: 500 }}
    />
  </Box>
);
