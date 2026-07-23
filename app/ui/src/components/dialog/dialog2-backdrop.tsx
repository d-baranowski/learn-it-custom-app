import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material';

interface Props {
  isOpen: boolean;
  onClick?: () => void;
}

const Dialog2Backdrop = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<Props>
>(function Dialog2Backdrop(props, ref) {
  const { children, onClick, isOpen } = props;

  const theme = useTheme();

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ opacity: isOpen ? 1 : 0 }}
      onClick={isOpen ? onClick : undefined}
      data-testid="dialog2-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(16, 24, 40, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: theme.zIndex.modal - 1,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {children}
      </div>
    </motion.div>
  );
});

Dialog2Backdrop.displayName = 'Dialog2Backdrop';

export default Dialog2Backdrop;
