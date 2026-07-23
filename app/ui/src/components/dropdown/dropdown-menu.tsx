import type {FC, ReactNode} from 'react';
import {useContext} from 'react';
import type {PaperProps} from '@mui/material/Paper';
import type {PopoverOrigin} from '@mui/material/Popover';
import Popover from '@mui/material/Popover';

import {DropdownContext} from './dropdown-context';

interface DropdownMenuProps {
  anchorEl?: HTMLElement | null;
  anchorOrigin?: PopoverOrigin;
  children?: ReactNode;
  disableScrollLock?: boolean;
  PaperProps?: PaperProps;
  transformOrigin?: PopoverOrigin;
}

export const DropdownMenu: FC<DropdownMenuProps> = (props) => {
  const { anchorEl, children, PaperProps, ...other } = props;
  const ctx = useContext(DropdownContext);

  return (
    <Popover
      anchorEl={anchorEl || ctx.anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'bottom',
      }}
      open={ctx.open}
      PaperProps={{
        ...PaperProps,
        onMouseEnter: ctx.onMenuEnter,
        onMouseLeave: ctx.onMenuLeave,
        sx: {
          ...PaperProps?.sx,
          pointerEvents: 'auto',
        },
      }}
      sx={{ pointerEvents: 'none' }}
      transformOrigin={{
        horizontal: 'left',
        vertical: 'top',
      }}
      {...other}
    >
      {children}
    </Popover>
  );
};
