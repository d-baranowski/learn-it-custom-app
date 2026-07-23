import * as React from 'react';
import Button from '@mui/material/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StyledMenu from '~/components/styled-menu';
import MenuItem from '@mui/material/MenuItem';
import {useTranslation} from 'next-i18next';

type GridActionsButtonProps = {
  id?: string;
  title?: string;
  children:
    | React.ReactElement<typeof MenuItem>
    | React.ReactElement<typeof MenuItem>[];
  endIcon?: React.ReactNode;
  disabled?: boolean;
};

export default function GridActionsMenuButton(props: GridActionsButtonProps) {
  const { t } = useTranslation('common');
  const {
    children,
    title = t('Actions'),
    id = 'grid-actions-button',
    endIcon = <KeyboardArrowDownIcon />,
  } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id={id}
        data-testid="grid-actions-button"
        aria-controls={open ? 'grid-actions-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={endIcon}
        disabled={props.disabled}
      >
        {title}
      </Button>
      <StyledMenu
        id="grid-actions-menu"
        data-testid="grid-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'grid-actions-button',
          // Close as soon as any action fires. Item clicks bubble here, so this
          // covers custom items (e.g. DeleteActionMenuItem) that don't forward
          // an injected onClick.
          onClick: handleClose,
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        // Items own imperative dialogs (material-ui-confirm auto-closes a
        // dialog when its owning component unmounts). Closing the menu on an
        // action click must not unmount them, or the confirm dialog vanishes
        // the instant it opens.
        keepMounted
        disableScrollLock
        slotProps={{
          root: {
            sx: {
              '& .MuiBackdrop-root': {
                backgroundColor: 'transparent',
                backdropFilter: 'none',
              },
            },
          },
        }}
      >
        {children}
      </StyledMenu>
    </div>
  );
}
