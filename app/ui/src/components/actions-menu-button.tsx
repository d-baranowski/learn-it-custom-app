import * as React from 'react';
import Button from '@mui/material/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StyledMenu from '~/components/styled-menu';
import {MenuItemProps} from '@mui/material/MenuItem';

type ActionsButtonItemProps = MenuItemProps & { onClick?: (event: React.MouseEvent<HTMLElement>) => void };

type ActionsButtonProps = {
  children: React.ReactElement<ActionsButtonItemProps> | React.ReactElement<ActionsButtonItemProps>[];
};

export default function ActionsMenuButton({children}: ActionsButtonProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const actions = React.Children.map(children, child => {
    const originalOnClick = child.props.onClick;
    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        if (originalOnClick) {
          originalOnClick(event);
        }
        handleClose();
      }
    });
  });

  return (
    <div>
      <Button
        id="actions-button"
        aria-controls={open ? 'actions-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon/>}
      >
        Actions
      </Button>
      <StyledMenu
        id="actions-menu"
        MenuListProps={{
          'aria-labelledby': 'actions-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {actions}
      </StyledMenu>
    </div>
  );
}