import {inputLabelClasses} from '@mui/material/InputLabel';
import {tableCellClasses} from '@mui/material/TableCell';
import type {Components} from '@mui/material/styles/components';
import {createTheme} from '@mui/material/styles';
import {LinkBehaviour} from "~/theme/base/link";

// Used only to create transitions
const muiTheme = createTheme();

export const createComponents = (): Components => {
  return {
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0,
        },
      },
    },
    // MuiAutocomplete: {
    //   styleOverrides: {
    //     root: {
    //       height: 40,
    //     },
    //     inputRoot: {
    //       height: 40,
    //       '& .MuiInputBase-input': {
    //         height: '40px',
    //         padding: '0 14px',
    //       },
    //     },
    //     option: {
    //       height: '30px',
    //       fontSize: '1rem',
    //     },
    //   },
    // },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
        },
        sizeSmall: {
          padding: '6px 16px',
        },
        sizeMedium: {
          padding: '9px 20px',
        },
        sizeLarge: {
          padding: '11px 24px',
        },
        textSizeSmall: {
          padding: '7px 12px',
        },
        textSizeMedium: {
          padding: '9px 16px',
        },
        textSizeLarge: {
          padding: '12px 16px',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehaviour
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10, //20
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px 24px', // padding: '32px 24px',
          '&:last-child': {
            paddingBottom: '32px',
          },
        },
      },
    },
    MuiCardHeader: {
      defaultProps: {
        titleTypographyProps: {
          variant: 'h6',
        },
        subheaderTypographyProps: {
          variant: 'body2',
        },
      },
      styleOverrides: {
        root: {
          padding: '24px 24px 16px', //'32px 24px 16px',
        },
      },
    },
    MuiCheckbox: {
      defaultProps: {
        color: 'primary',
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
        },
        body: {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
        },
        '#root, #__next': {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
        },
        '#nprogress': {
          pointerEvents: 'none',
        },
        '#nprogress .bar': {
          height: 3,
          left: 0,
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 2000,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        sizeSmall: {
          padding: 4,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            opacity: 1,
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        input: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: '16px',
          //lineHeight: '24px',
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          overflow: 'hidden',
          minHeight: 48,
          boxSizing: 'border-box',
          transition: muiTheme.transitions.create(['background-color', 'box-shadow']),
          '&:before': {
            display: 'none',
          },
          '&:after': {
            display: 'none',
          },
        },
        input: ({ ownerState }: { ownerState: { multiline?: boolean } }) => ({
          fontSize: 14,
          fontWeight: 500,
          lineHeight: '20px',
          padding: ownerState.multiline ? 0 : '20px 12px 8px',
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          fontSize: 14, //14
          fontWeight: 500,
          lineHeight: '14px', //24px
          padding: '14px 6px', //'14px 6px'
        },
        notchedOutline: {
          transition: muiTheme.transitions.create(['border-color', 'box-shadow']),
        },
      },
    },
    MuiInputLabel: {
      defaultProps: {
        shrink: true,
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: 13,
          fontWeight: 500,
          [`&.${inputLabelClasses.filled}`]: {
            transform: 'translate(12px, 14px) scale(1)',
            color: '#5F5E5A',
          },
          [`&.${inputLabelClasses.shrink}`]: {
            [`&.${inputLabelClasses.standard}`]: {
              transform: 'translate(0, -1.5px) scale(0.85)',
            },
            [`&.${inputLabelClasses.filled}`]: {
              fontSize: 11,
              transform: 'translate(12px, 5px) scale(1)',
            },
            [`&.${inputLabelClasses.outlined}`]: {
              transform: 'translate(14px, -9px) scale(0.85)',
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
        component: LinkBehaviour,
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          marginRight: '16px',
          minWidth: 'unset',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiPopover: {
      defaultProps: {
        elevation: 16,
      },
    },
    MuiRadio: {
      defaultProps: {
        color: 'primary',
      },
    },
    MuiSwitch: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: {
          width: 36,
          height: 20,
          padding: 0,
          display: 'flex',
        },
        switchBase: {
          padding: 2,
          color: '#FFFFFF',
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#FFFFFF',
            '& + .MuiSwitch-track': {
              backgroundColor: '#534AB7',
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 16,
          height: 16,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
        },
        track: {
          borderRadius: 10,
          backgroundColor: '#A5A299',
          opacity: 1,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          // Reserve top padding for the floating label, keep bottom snug.
          // Total height for an empty single-select: 24 + 20 (lineHeight)
          // + 4 = 48px — matches our MuiFilledInput.minHeight so plain
          // TextFields and Autocompletes line up.
          '& .MuiFilledInput-root': {
            paddingTop: '24px !important',
            paddingBottom: '4px !important',
            paddingLeft: '8px !important',
            minHeight: 48,
          },
          '& .MuiFilledInput-root .MuiAutocomplete-input': {
            padding: '0 4px !important',
            height: 20,
            boxSizing: 'content-box',
          },
          // Multi-select: chips render inside inputRoot. The 24px top
          // padding above keeps them clear of the floating label; row
          // grows naturally as chips wrap.
          '& .MuiFilledInput-root .MuiAutocomplete-tag': {
            margin: '2px 4px 2px 0',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.71,
          minWidth: 'auto',
          paddingLeft: 0,
          paddingRight: 0,
          textTransform: 'none',
          color: '#5F5E5A',
          '&.Mui-selected': {
            color: '#534AB7',
          },
          '& + &': {
            marginLeft: 24,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '5px 5px', //'15px 16px',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          [`& .${tableCellClasses.root}`]: {
            borderBottom: 'none',
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 2,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
          [`& .${tableCellClasses.paddingCheckbox}`]: {
            paddingTop: 4,
            paddingBottom: 4,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'filled',
        InputProps: { disableUnderline: true },
        InputLabelProps: { shrink: true },
      },
    },
  };
};
