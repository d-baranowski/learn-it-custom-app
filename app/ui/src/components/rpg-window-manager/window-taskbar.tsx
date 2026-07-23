import React from 'react';
import {Box, Button, Stack} from '@mui/material';
import {useWindows, useWindowActions} from '~/_lib/window/state/hooks';

/**
 * Simple bottom-right "taskbar" for minimized windows (Windows XP-ish).
 * Shows one button per minimized window; clicking restores it.
 */
const WindowTaskbar: React.FC = () => {
  const windows = useWindows();
  const {restoreWindow} = useWindowActions();

  const minimized = React.useMemo(() => {
    return Object.values(windows)
      .filter((w) => !!w.isMinimized)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [windows]);

  if (minimized.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 8,
        bottom: 8,
        zIndex: (minimized[minimized.length - 1]?.zIndex || 2000) + 100,
        pointerEvents: 'auto',
      }}
    >
      <Stack direction="row" spacing={1}>
        {minimized.map((w) => (
          <Button
            key={w.id}
            size="small"
            variant="contained"
            onClick={() => restoreWindow(w.id)}
            sx={{
              textTransform: 'none',
              maxWidth: 240,
              minWidth: 120,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {w.title}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default WindowTaskbar;

