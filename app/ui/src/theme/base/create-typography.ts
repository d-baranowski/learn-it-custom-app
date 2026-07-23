import type {TypographyOptions} from '@mui/material/styles/createTypography';

export const createTypography = (): TypographyOptions => {
  return {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.57,
    },
    button: {
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.66,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 500,
      letterSpacing: '0.6px',
      lineHeight: 1.6,
      textTransform: 'uppercase',
      color: '#888780',
    },
    h1: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h5: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h6: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '1.125rem',
      lineHeight: 1.2,
    },
  };
};
