import type {FC} from 'react';
import {ReactNode} from 'react';
import XIcon from '@untitled-ui/icons-react/build/esm/X';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type {Theme} from '@mui/material/styles/createTheme';
import {Box} from '@mui/material';

export interface GridSidebarProps {
  container?: HTMLDivElement | null;
  onClose?: () => void;
  open?: boolean;
  children?: ReactNode;
}

export const GridSidebar: FC<GridSidebarProps> = (props) => {
  const {
    container,
    onClose,
    open,
    children,
    ...other
  } = props;
  //const queryRef = useRef<HTMLInputElement | null>(null);
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

  const content = (
    <div>
      <Stack
        alignItems="center"
        justifyContent="space-between"
        direction="row"
        sx={{p: 1.5, pb: 2, pt: 1}}
      >
        <Typography variant="h5">Filters</Typography>
        <IconButton
          aria-label={'Filters'}
          onClick={onClose} sx={{
          m: 0, p: 0,
        }}>
          <SvgIcon>
            <XIcon/>
          </SvgIcon>
        </IconButton>
      </Stack>
      <Stack
        spacing={3}
        sx={{p: 1.5}}
        data-testid={'grid-filter-sidebar-content'}
      >
        {children}
      </Stack>
    </div>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open={open}
        PaperProps={{
          elevation: 0,
          sx: {
            border: 'none',
            borderRadius: 0,
            borderTopRightRadius: '5px',
            borderBottomRightRadius: '5px',
            overflow: 'auto',
            position: 'relative',
            width: 300,
          },
        }}
        SlideProps={{container}}
        variant="persistent"
        sx={{
          p: 3,
          pl: 0,
          paddingTop: 0,
          paddingBottom: 0,
        }}
        {...other}
      >
        <Box sx={{paddingTop: 2, paddingBottom: 2}}>
          {content}
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      hideBackdrop={true}
      ModalProps={{
        container,
        sx: {
          pointerEvents: 'none',
          position: 'absolute',
        },
      }}
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: {
          maxWidth: '100%',
          width: 300,
          pointerEvents: 'auto',
          position: 'absolute',
        },
      }}
      SlideProps={{container}}
      variant="temporary"
      {...other}
    >
      {content}
    </Drawer>
  );
};
