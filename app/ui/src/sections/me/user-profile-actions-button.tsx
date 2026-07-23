import * as React from 'react';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StyledMenu from "~/components/styled-menu";
import LogoutIcon from '@mui/icons-material/Logout';
import {useSession} from "~/auth/session-provider";

export default function UserProfileActionsButton() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const {logOut} = useSession();
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id="user-profile-grid-actions-button"
        aria-controls={open ? 'user-profile-grid-actions-menu' : undefined}
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
        id="user-profile-grid-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'user-profile-grid-actions-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            void logOut()
          }}
        >
          <LogoutIcon/>
          Logout
        </MenuItem>
        {/*<Divider sx={{my: 0.5}}/>*/}
      </StyledMenu>
    </div>
  );
}
