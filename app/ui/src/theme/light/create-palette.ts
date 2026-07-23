import type {PaletteOptions} from '@mui/material/styles/createPalette';
import {error, info, neutral, primary, success, warning} from '../colors';

export const createPalette = (): PaletteOptions => ({
  action: {
    active: '#5F5E5A',
    disabled: 'rgba(44, 44, 42, 0.38)',
    disabledBackground: 'rgba(44, 44, 42, 0.12)',
    focus: 'rgba(44, 44, 42, 0.16)',
    hover: '#F0EEE3',
    selected: 'rgba(83, 74, 183, 0.12)',
  },
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
  },
  divider: '#E0DED5',
  error,
  info,
  mode: 'light',
  neutral,
  primary,
  success,
  text: {
    primary: '#2C2C2A',
    secondary: '#5F5E5A',
    disabled: '#888780',
  },
  warning,
});
