import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import SvgIcon from '@mui/material/SvgIcon';
import type {FC} from 'react';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {useSession} from '~/auth/session-provider';
import {useTranslation} from 'next-i18next';
import React from 'react';
import { NotificationPreferencesModal } from '~/sections/core/notification/notification_preferences';

interface AccountPopoverProps {
  anchorEl: null | Element;
  onClose?: () => void;
  open?: boolean;
}

export const AccountPopover: FC<AccountPopoverProps> = (props) => {
  const { anchorEl, onClose, open, ...other } = props;
  const { t } = useTranslation('common');

  const { session, logOut } = useSession();
  const [prefsOpen, setPrefsOpen] = React.useState(false);
  if (!session) return null;

  return (
    <>
    <NotificationPreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'center',
        vertical: 'bottom',
      }}
      disableScrollLock
      onClose={onClose}
      open={!!open}
      PaperProps={{ sx: { width: 200 } }}
      {...other}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">{session.user?.displayName}</Typography>
        <Typography color="text.secondary" variant="body2">
          {session.user?.email}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 1 }}>
        {/*<ListItemButton*/}
        {/*  component={RouterLink}*/}
        {/*  href={paths.me.index()}*/}
        {/*  onClick={onClose}*/}
        {/*  sx={{*/}
        {/*    borderRadius: 1,*/}
        {/*    px: 1,*/}
        {/*    py: 0.5,*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <ListItemIcon>*/}
        {/*    <SvgIcon fontSize="small">*/}
        {/*      <User03Icon/>*/}
        {/*    </SvgIcon>*/}
        {/*  </ListItemIcon>*/}
        {/*  <ListItemText primary={<Typography variant="body1">Profile</Typography>}/>*/}
        {/*</ListItemButton>*/}
        <ListItemButton
          onClick={() => { setPrefsOpen(true); onClose?.(); }}
          sx={{ borderRadius: 1, px: 1, py: 0.5 }}
        >
          <ListItemIcon>
            <SvgIcon fontSize="small"><NotificationsIcon /></SvgIcon>
          </ListItemIcon>
          <ListItemText primary={<Typography variant="body1">{t('Notification Preferences')}</Typography>} />
        </ListItemButton>
        <ListItemButton
          data-testid="log-out-button"
          onClick={() => void logOut()}
          sx={{
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          <ListItemIcon>
            <SvgIcon fontSize="small">
              <LogoutIcon />
            </SvgIcon>
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body1">{t('Logout')}</Typography>}
          />
        </ListItemButton>
      </Box>
    </Popover>
    </>
  );
};
