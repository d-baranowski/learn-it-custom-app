import type {ThemeOptions} from '@mui/material/styles/createTheme';
import {createTypography} from './create-typography';
import {createComponents} from './create-components';

export const createOptions = (): ThemeOptions => ({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1440,
      xxl: 1920,
    },
  },
  components: createComponents(),
  shape: {
    borderRadius: 8,
  },
  typography: createTypography(),
});
