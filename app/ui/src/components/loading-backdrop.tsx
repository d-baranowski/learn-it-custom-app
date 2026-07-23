import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface Props {
  loading: boolean | undefined;
}

const LoadingBackdrop: React.FunctionComponent<React.PropsWithChildren<Props>> =
  function LoadingBackdrop(props) {
    const { children, loading } = props;

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Backdrop
          sx={{
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
          }}
          open={!!loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        {children}
      </Box>
    );
  };

export default LoadingBackdrop;
