import {alpha} from '@mui/material/styles';
import {filledInputClasses} from '@mui/material/FilledInput';
import {outlinedInputClasses} from '@mui/material/OutlinedInput';
import {tableCellClasses} from '@mui/material/TableCell';
import {common} from '@mui/material/colors';
import type {Components} from '@mui/material/styles/components';
import type {PaletteColor, PaletteOptions} from '@mui/material/styles/createPalette';

interface Config {
  palette: PaletteOptions;
}

const FIELD_FILL = '#F6F4EE';
const FIELD_FILL_HOVER = '#F0EEE3';

export const createComponents = ({ palette }: Config): Components => {
  return {
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.neutral![200],
          color: common.black,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(16, 24, 40, 0.5)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 5px 22px rgba(0, 0, 0, 0.04), 0px 0px 0px 0.5px rgba(0, 0, 0, 0.03)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        icon: {
          color: palette.action!.active,
        },
        root: {
          borderColor: palette.divider as string,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '#nprogress .bar': {
          backgroundColor: (palette.primary as PaletteColor).main,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            color: palette.text!.secondary,
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: FIELD_FILL,
          '&:hover': {
            backgroundColor: FIELD_FILL_HOVER,
          },
          [`&.${filledInputClasses.disabled}`]: {
            backgroundColor: FIELD_FILL,
            opacity: 0.6,
          },
          [`&.${filledInputClasses.focused}`]: {
            backgroundColor: FIELD_FILL,
            boxShadow: `inset 0 0 0 2px ${(palette.primary as PaletteColor).main}`,
          },
          [`&.${filledInputClasses.error}`]: {
            boxShadow: `inset 0 0 0 2px ${(palette.error as PaletteColor).main}`,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          [`&.${outlinedInputClasses.focused}`]: {
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: (palette.primary as PaletteColor).main,
              borderWidth: '2px',
            },
          },
          [`&.${outlinedInputClasses.error}`]: {
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: (palette.error as PaletteColor).main,
            },
          },
        },
        notchedOutline: {
          borderColor: palette.divider as string,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${palette.divider}`,
          minHeight: 40,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {},
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          [`& .${tableCellClasses.root}`]: {
            backgroundColor: palette.neutral![50],
            color: palette.neutral![700],
          },
        },
      },
    },
    // @ts-ignore
    MuiTimelineConnector: {
      styleOverrides: {
        root: {
          backgroundColor: palette.divider,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backdropFilter: 'blur(6px)',
          background: alpha(palette.neutral![900], 0.8),
        },
      },
    },
    MuiTreeView: {
      styleOverrides: {
        root: {
          backgroundColor: palette.neutral![50],
          color: palette.neutral![700],
        },
      },
    },
  };
};
