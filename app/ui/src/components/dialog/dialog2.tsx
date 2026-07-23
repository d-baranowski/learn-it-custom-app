import {
  motion,
  useDragControls,
  useMotionValue,
  Variants,
} from 'framer-motion';
import { Breakpoint } from '@mui/material';
import { SxProps, useTheme } from '@mui/material/styles';
import { Theme } from '@mui/material/styles/createTheme';
import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import { useWindowActions, useWindowById } from '~/_lib/window/state/hooks';
import { fitRectToViewport, getViewportSize } from '~/_lib/window/state/fit_rect_to_viewport';
import MinimizeIcon from '@mui/icons-material/Minimize';
import IconButton from '@mui/material/IconButton';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import FilterNoneIcon from '@mui/icons-material/FilterNone';
import { Dialog2SizeProvider } from './dialog2-size-context';
import { Dialog2HeaderActionsProvider } from './dialog2-header-actions-context';

interface Props {
  /** Redux window id. Required when using redux-managed window state. */
  windowId: string;

  title: string;
  isOpen: boolean;
  isFullScreen?: boolean;
  close: () => void;
  initialWidth?: Breakpoint;
  draggable?: boolean;
  headerStyles?: SxProps<Theme>;

  /**
   * Optional ref to an element that defines the drag boundaries.
   * Commonly you pass the backdrop ref here.
   */
  dragConstraintsRef?: React.RefObject<HTMLElement>;

  /** Enable resizing from the bottom-right corner. */
  resizable?: boolean;

  /** Min dialog width in px when resizable. */
  minWidthPx?: number;

  /** Min dialog height in px when resizable. */
  minHeightPx?: number;
}

const fadeInAnimationProps: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      type: 'spring',
      damping: 25,
      stiffness: 500,
    },
  },
  exit: {
    opacity: 0,
  },
};

const Dialog2: React.FunctionComponent<React.PropsWithChildren<Props>> =
  function Dialog(props) {
    const {
      windowId,
      children,
      isOpen,
      isFullScreen,
      close,
      title,
      initialWidth = 'sm',
      draggable = true,
      headerStyles = {},
      dragConstraintsRef,
      resizable = true,
      minWidthPx = 360,
      minHeightPx = 10,
    } = props;

    const theme = useTheme();
    const breakpoints = React.useMemo(() => theme.breakpoints, [theme]);
    const actualStartWidth = React.useMemo(
      () => breakpoints.values[initialWidth] || breakpoints.values.sm,
      [breakpoints, initialWidth],
    );

    const windowState = useWindowById(windowId);
    const hasWindowState = !!windowState;
    const {
      updateWindowPosition,
      updateWindowSize,
      bringWindowToFront,
      toggleMinimizeWindow,
      toggleFullScreenWindow,
    } = useWindowActions();

    const controls = useDragControls();

    const mvX = useMotionValue(0);
    const mvY = useMotionValue(0);
    const isDraggingRef = React.useRef(false);

    // Sync motion values from redux when we're not actively dragging
    React.useEffect(() => {
      if (isDraggingRef.current) return;
      if (!windowState) return;
      mvX.set(windowState?.position?.x ?? 0);
      mvY.set(windowState?.position?.y ?? 0);
    }, [mvX, mvY, windowState, windowState?.position?.x, windowState?.position?.y]);

    const dialogRef = React.useRef<HTMLDivElement | null>(null);

    const [isUserResizing, setIsUserResizing] = React.useState(false);
    const [headerActions, setHeaderActions] = React.useState<React.ReactNode>(null);
    const handleSetHeaderActions = React.useCallback((node: React.ReactNode) => {
      setHeaderActions(node);
    }, []);

    const resizeStart = React.useRef<{
      startX: number;
      startY: number;
      startW: number;
      startH: number;
    } | null>(null);

    // Center the dialog on first open if we have no position yet.
    React.useEffect(() => {
      if (!isOpen) return;
      if (isFullScreen) return;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
      if (!vw || !vh) return;

      if (!windowState) {
        const centerStandaloneDialog = () => {
          const rect = dialogRef.current?.getBoundingClientRect();
          const estW = rect?.width || actualStartWidth;
          const estH = rect?.height || 600;

          mvX.set(Math.max(0, Math.round((vw - estW) / 2)));
          mvY.set(Math.max(0, Math.round((vh - estH) / 2)));
        };

        centerStandaloneDialog();
        const rafId = window.requestAnimationFrame(centerStandaloneDialog);
        return () => window.cancelAnimationFrame(rafId);
      }

      if (windowState.position) return;

      // Estimate initial size: use saved size if any, else the breakpoint width and a reasonable height.
      const estW = windowState.size?.width || actualStartWidth;
      const estH = windowState.size?.height || 600;

      const x = Math.max(0, Math.round((vw - estW) / 2));
      const y = Math.max(0, Math.round((vh - estH) / 2));

      updateWindowPosition(windowId, { x, y });
    }, [
      actualStartWidth,
      isFullScreen,
      isOpen,
      mvX,
      mvY,
      updateWindowPosition,
      windowId,
      windowState,
    ]);

    const onResizePointerMove = React.useCallback(
      (e: PointerEvent) => {
        const s = resizeStart.current;
        if (!s) return;

        const dx = e.clientX - s.startX;
        const dy = e.clientY - s.startY;

        const nextW = Math.max(minWidthPx, s.startW + dx);
        const nextH = Math.max(minHeightPx, s.startH + dy);

        updateWindowSize(windowId, { width: nextW, height: nextH });
      },
      [minHeightPx, minWidthPx, updateWindowSize, windowId],
    );

    const setGlobalNoSelect = React.useCallback((enabled: boolean) => {
      if (typeof document === 'undefined') return;
      const styleAny = document.body.style as any;
      if (enabled) {
        document.body.style.userSelect = 'none';
        styleAny.webkitUserSelect = 'none';
      } else {
        document.body.style.userSelect = '';
        styleAny.webkitUserSelect = '';
      }
    }, []);

    React.useEffect(() => {
      return () => {
        // cleanup on unmount
        setGlobalNoSelect(false);
      };
    }, [setGlobalNoSelect]);

    const endResize = React.useCallback(() => {
      if (!resizeStart.current) return;

      resizeStart.current = null;
      setIsUserResizing(false);
      window.removeEventListener('pointermove', onResizePointerMove);
      window.removeEventListener('pointerup', endResize);
      setGlobalNoSelect(false);
    }, [onResizePointerMove, setGlobalNoSelect]);

    const startResize = React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();

        setGlobalNoSelect(true);
        setIsUserResizing(true);

        const el = dialogRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        resizeStart.current = {
          startX: e.clientX,
          startY: e.clientY,
          // use current on-screen size at the moment resize begins to avoid any first-drag jump
          startW: rect.width,
          startH: rect.height,
        };

        // capture pointer so we keep receiving events even if the cursor leaves the handle
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        window.addEventListener('pointermove', onResizePointerMove);
        window.addEventListener('pointerup', endResize);
      },
      [endResize, onResizePointerMove, setGlobalNoSelect],
    );

    const isActuallyFullScreen = !!windowState?.isFullScreen || !!isFullScreen;
    const topStyle = isActuallyFullScreen ? 0 : hasWindowState ? 0 : '50%';
    const leftStyle = isActuallyFullScreen ? 0 : hasWindowState ? 0 : '50%';
    const xStyle = isActuallyFullScreen ? 0 : hasWindowState ? mvX : '-50%';
    const yStyle = isActuallyFullScreen ? 0 : hasWindowState ? mvY : '-50%';

    const widthStyle = isActuallyFullScreen
      ? '100%'
      : windowState?.size?.width != null
        ? `${windowState.size.width}px`
        : `clamp(50%, ${actualStartWidth}px, 90%)`;

    const heightStyle = isActuallyFullScreen
      ? '100%'
      : windowState?.size?.height != null
        ? `${windowState.size.height}px`
        : 'auto';

    // Skip transition during corner-drag resize and on first paint (before
    // managed size exists) to avoid animating from clamp() to a px value.
    const sizeIsManaged = windowState?.size?.width != null;
    const transitionStyle =
      isUserResizing || !sizeIsManaged
        ? 'none'
        : 'width 0.2s ease, height 0.2s ease';

    return (
      <motion.div
        ref={dialogRef}
        data-window-id={windowId}
        onPointerDownCapture={() => {
          if (hasWindowState) {
            bringWindowToFront(windowId);
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onMouseDown={() => {
          if (hasWindowState) {
            bringWindowToFront(windowId);
          }
        }}
        drag={draggable && !isActuallyFullScreen}
        dragConstraints={dragConstraintsRef}
        dragControls={controls}
        dragListener={false}
        dragMomentum={false}
        onDragStart={() => {
          isDraggingRef.current = true;
          setGlobalNoSelect(true);
        }}
        onDragEnd={() => {
          isDraggingRef.current = false;
          setGlobalNoSelect(false);
          const nextX = mvX.get();
          const nextY = mvY.get();
          const node = dialogRef.current;
          const measured = node?.getBoundingClientRect();
          const width = windowState?.size?.width ?? measured?.width ?? 0;
          const height = windowState?.size?.height ?? measured?.height ?? 0;
          const fit = fitRectToViewport(
            { x: nextX, y: nextY, width, height },
            getViewportSize(),
          );
          mvX.set(fit.x);
          mvY.set(fit.y);
          updateWindowPosition(windowId, { x: fit.x, y: fit.y });
        }}
        data-testid="dialog2-container"
        style={{
          width: widthStyle,
          height: heightStyle,
          transition: transitionStyle,
          backgroundColor: theme.palette.background.paper,
          zIndex: windowState?.zIndex ?? theme.zIndex.modal,
          borderRadius: 16,
          border: `0.5px solid ${theme.palette.divider}`,
          boxShadow: '0 20px 40px -10px rgba(16, 24, 40, 0.15)',
          overflow: 'hidden',
          position: 'absolute',
          top: topStyle,
          left: leftStyle,
          right: isActuallyFullScreen ? 0 : undefined,
          bottom: isActuallyFullScreen ? 0 : undefined,
          x: xStyle,
          y: yStyle,
          display: isOpen ? 'block' : 'none',
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeInAnimationProps}
      >
        <DialogTitle
          className={draggable && !isActuallyFullScreen ? 'drag-handle' : ''}
          onPointerDown={(e) => {
            // prevent text selection while dragging
            e.preventDefault();
            // allow dragging the whole dialog by grabbing the title bar
            if (draggable && !isActuallyFullScreen) controls.start(e);
          }}
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            px: 3,
            pt: 2,
            pb: 0,
            cursor: draggable ? 'move' : 'inherit',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            ...headerStyles,
            fontSize: '1.125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                flex: '0 1 auto',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Box>
            {headerActions}
          </Box>

          <Box
            sx={{
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
              gap: 0.5,
            }}
          >
            {hasWindowState && (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimizeWindow(windowId);
                  }}
                  sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'text.primary' } }}
                >
                  <MinimizeIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullScreenWindow(windowId);
                  }}
                  sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'text.primary' } }}
                >
                  {isActuallyFullScreen ? (
                    <FilterNoneIcon fontSize="small" />
                  ) : (
                    <CropSquareIcon fontSize="small" />
                  )}
                </IconButton>
              </>
            )}

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'text.primary' } }}
              data-testid="window-close-btn"
              aria-label="Close window"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: 2,
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'auto',
            flex: draggable ? 1 : 'initial',
            height:
              windowState?.size?.height != null || isActuallyFullScreen
                ? 'calc(100% - 53px)'
                : 'auto',
          }}
        >
          <Dialog2HeaderActionsProvider onActions={handleSetHeaderActions}>
            <Dialog2SizeProvider windowId={props.windowId} >{children}</Dialog2SizeProvider>
          </Dialog2HeaderActionsProvider>
        </DialogContent>

        {resizable && !isActuallyFullScreen && (
          <div
            aria-label="Resize dialog"
            role="separator"
            onPointerDown={startResize}
            style={{
              position: 'absolute',
              right: 6,
              bottom: 6,
              width: 18,
              height: 18,
              cursor: 'nwse-resize',
              zIndex: (windowState?.zIndex ?? theme.zIndex.modal) + 1,
              touchAction: 'none',
              userSelect: 'none',
              // subtle diagonal lines handle
              background:
                'linear-gradient(135deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 56%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0) 71%)',
              borderRadius: 2,
            }}
          />
        )}
      </motion.div>
    );
  };

export default Dialog2;
