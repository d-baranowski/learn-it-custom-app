import type {ColorRange, PaletteColor} from '@mui/material/styles/createPalette';
import {alpha} from '@mui/material/styles';

const withAlphas = (color: PaletteColor): PaletteColor => ({
  ...color,
  alpha4: alpha(color.main, 0.04),
  alpha8: alpha(color.main, 0.08),
  alpha12: alpha(color.main, 0.12),
  alpha30: alpha(color.main, 0.3),
  alpha50: alpha(color.main, 0.5),
});

export const neutral: ColorRange = {
  50: '#F8F9FA',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D2D6DB',
  400: '#9DA4AE',
  500: '#6C737F',
  600: '#4D5761',
  700: '#2F3746',
  800: '#1C2536',
  900: '#111927',
};

export const primary = withAlphas({
  lightest: '#EDEAFB',
  light: '#7B72D3',
  main: '#534AB7',
  dark: '#3B348C',
  darkest: '#27226B',
  contrastText: '#FFFFFF',
});

export const success = withAlphas({
  lightest: '#F0FDF9',
  light: '#3FC79A',
  main: '#10B981',
  dark: '#0B815A',
  darkest: '#134E48',
  contrastText: '#FFFFFF',
});

export const info = withAlphas({
  lightest: '#ECFDFF',
  light: '#CFF9FE',
  main: '#06AED4',
  dark: '#0E7090',
  darkest: '#164C63',
  contrastText: '#FFFFFF',
});

export const warning = withAlphas({
  lightest: '#FFFAEB',
  light: '#FEF0C7',
  main: '#F79009',
  dark: '#B54708',
  darkest: '#7A2E0E',
  contrastText: '#FFFFFF',
});

export const error = withAlphas({
  lightest: '#FBE9E9',
  light: '#D86060',
  main: '#A32D2D',
  dark: '#7A2121',
  darkest: '#511616',
  contrastText: '#FFFFFF',
});
