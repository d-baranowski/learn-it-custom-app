import type {FC} from 'react';
import User01Icon from '@untitled-ui/icons-react/build/esm/User01';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import SvgIcon from '@mui/material/SvgIcon';
import {usePopover} from 'src/hooks/use-popover';
import {get} from '@gen/core/me/v1/me-MeService_connectquery';

import {AccountPopover} from './account-popover';
import {useQuery} from '@connectrpc/connect-query';
import {useSession} from '~/auth/session-provider';
import {Typography} from '@mui/material';

export const AccountButton: FC = () => {
  const popover = usePopover<HTMLButtonElement>();

  const { session } = useSession();
  const { data: user } = useQuery(get);

  if (!session) return null;
  return (
    <>
      <Box
        component={ButtonBase}
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        sx={{
          alignItems: 'center',
          display: 'flex',
          borderWidth: 2,
          borderStyle: 'solid',
          borderColor: 'divider',
          height: 44,
          width: 'auto',
          borderRadius: 1
        }}
        data-testid="account-button"
      >
        <Avatar
          sx={{
            height: 32,
            width: 32,
            borderRadius: 1,
            marginLeft: 1
            }}
          variant="square"
          src={user?.avatar}
        >
          <SvgIcon>
            <User01Icon />
          </SvgIcon>
        </Avatar>
        <Box sx={{ marginLeft: 2, marginRight: 1 }}> {/* Space between avatar and text */}
          <Typography variant="body2">{user?.displayName || 'User Name'}</Typography>
        </Box>
      </Box>
      <AccountPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </>
  );
};
