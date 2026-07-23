import React from 'react';
import { Box, InputBase } from '@mui/material';
import { pillSx } from './pill-sx';

export interface PillTimeProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export const PillTime: React.FC<PillTimeProps> = ({ value, onChange, disabled }) => (
  <Box sx={pillSx}>
    <InputBase
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      inputProps={{ style: { padding: 0 } }}
      sx={{ fontSize: 14, fontWeight: 500, '& input::-webkit-calendar-picker-indicator': { opacity: 0.5, cursor: 'pointer' } }}
    />
  </Box>
);
