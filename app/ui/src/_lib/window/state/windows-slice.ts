import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import { Breakpoint } from '@mui/material';
import { fitRectToViewport, Viewport, SAFE_MARGIN } from './fit_rect_to_viewport';

const CASCADE_OFFSET = 40;

// Define the state structure for a single window/dialog
export interface WindowReduxState {
  id: string;
  formName: string;
  title: string;
  isOpen: boolean;
  maxWidth: Breakpoint;
  isFullScreen?: boolean;
  draggable?: boolean;
  formProps?: Record<string, any>;
  position?: {
    x: number;
    y: number;
  };
  size?: {
    width: number | undefined;
    height: number | undefined;
  };
  zIndex?: number;

  /** When true, window is minimized and should not render its contents */
  isMinimized?: boolean;

  /** Per-window UI state that should not be shared across windows */
  ui?: {
    activeTabIndex?: number;
  };
}

// Define the structure for the slice state
export interface WindowsState {
  windows: Record<string, WindowReduxState>;
  nextZIndex: number;
}

// Initial state
const initialState: WindowsState = {
  windows: {},
  nextZIndex: 1400, // Start above default Material-UI dialog z-index
};

// MUI default breakpoint widths in px. Mirrored here so we can pre-set a
// window's initial size synchronously at openWindow time (no theme access in
// the reducer), avoiding any first-paint where Dialog2 falls back to its
// clamp(50%, ${actualStartWidth}, 90%) expression.
const BREAKPOINT_PX: Record<Breakpoint, number> = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
  xxl: 1920,
};

// Helper function to initialize a new window state
export const getInitialWindowState = (
  formName: string,
  title: string,
  maxWidth: Breakpoint = 'md',
  formProps?: Record<string, any>,
  id?: string,
): WindowReduxState => ({
  id: id || nanoid(),
  formName,
  title,
  isOpen: true,
  maxWidth,
  draggable: true,
  formProps: formProps
    ? Object.fromEntries(
        Object.entries(formProps).filter(([, v]) => typeof v !== 'function'),
      )
    : undefined,
  isMinimized: false,
  ui: {
    activeTabIndex: 0,
  },
});

// Create the windows slice
const windowsSlice = createSlice({
  name: 'windows',
  initialState,
  reducers: {
    // Open a new window/dialog
    windowOpen(
      state,
      action: PayloadAction<{
        formName: string;
        title: string;
        maxWidth?: Breakpoint;
        isFullScreen?: boolean;
        draggable?: boolean;
        formProps?: Record<string, any>;
        windowId: string;
        initialHeight?: number;
        initialWidth?: number;
        viewport?: Viewport;
      }>,
    ) {
      let {
        formName,
        title,
        maxWidth = 'md',
        isFullScreen = false,
        draggable = true,
        formProps,
        windowId,
        initialHeight,
        initialWidth,
      } = action.payload;

      const existingTitles = Object.values(state.windows).map((w) => w.title);
      const baseTitle = title;

      // Count existing windows that are either exactly the base title or already suffixed.
      const suffixRe = new RegExp(`^${escapeRegExp(baseTitle)}(\\s+(\\d+))?$`);
      let maxSuffix = 0;
      for (const t of existingTitles) {
        const m = t.match(suffixRe);
        if (!m) continue;
        const n = m[2] ? Number(m[2]) : 1;
        if (Number.isFinite(n)) maxSuffix = Math.max(maxSuffix, n);
      }
      if (maxSuffix >= 1) {
        title = `${baseTitle} ${maxSuffix + 1}`;
      }

      const windowState = getInitialWindowState(
        formName,
        title,
        maxWidth,
        formProps,
        windowId,
      );
      windowState.isFullScreen = isFullScreen;
      windowState.draggable = draggable;
      windowState.zIndex = state.nextZIndex;
      // Always set an initial size so Dialog2 never has to fall back to its
      // breakpoint-clamp expression on first paint. The explicit
      // initialWidth/initialHeight win, otherwise we derive from maxWidth.
      windowState.size = {
        width: initialWidth ?? BREAKPOINT_PX[maxWidth] ?? BREAKPOINT_PX.md,
        height: initialHeight ?? 700,
      };

      // Cascade new windows from the most recently focused one so it's
      // obvious a new window has opened on top of an existing one.
      const existingWindows = Object.values(state.windows);
      const viewport = action.payload.viewport;

      if (!isFullScreen && existingWindows.length > 0) {
        const sortedWindows = [...existingWindows]
          .filter(w => w.position)
          .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

        if (sortedWindows.length > 0 && sortedWindows[0].position) {
          const newX = sortedWindows[0].position.x + CASCADE_OFFSET;
          const newY = sortedWindows[0].position.y + CASCADE_OFFSET;
          windowState.position = { x: newX, y: newY };
        }
      }

      if (viewport && windowState.position) {
        const w = windowState.size?.width;
        const h = windowState.size?.height;
        if (w != null && h != null) {
          const fit = fitRectToViewport(
            { x: windowState.position.x, y: windowState.position.y, width: w, height: h },
            viewport,
          );
          windowState.position = { x: fit.x, y: fit.y };
          windowState.size = { width: fit.width, height: fit.height };
        } else {
          windowState.position = {
            x: Math.max(SAFE_MARGIN, Math.min(windowState.position.x, viewport.width - SAFE_MARGIN)),
            y: Math.max(SAFE_MARGIN, Math.min(windowState.position.y, viewport.height - SAFE_MARGIN)),
          };
        }
      }

      state.windows[windowState.id] = windowState;
      state.nextZIndex += 1;
    },

    windowSetActiveTab(
      state,
      action: PayloadAction<{ windowId: string; tabIndex: number }>,
    ) {
      const { windowId, tabIndex } = action.payload;
      const window = state.windows[windowId];
      if (!window) return;
      if (!window.ui) window.ui = {};
      window.ui.activeTabIndex = tabIndex;
    },

    windowClearUiState(state, action: PayloadAction<{ windowId: string }>) {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (!window) return;
      window.ui = { activeTabIndex: 0 };
    },

    // Close a window/dialog
    windowClose(state, action: PayloadAction<{ windowId: string }>) {
      const { windowId } = action.payload;
      if (state.windows[windowId]) {
        delete state.windows[windowId];
      }
    },

    // Update window position (for draggable windows)
    windowUpdatePosition(
      state,
      action: PayloadAction<{
        windowId: string;
        position: { x: number; y: number };
        viewport?: Viewport;
      }>,
    ) {
      const { windowId, position, viewport } = action.payload;
      const win = state.windows[windowId];
      if (!win) return;

      if (viewport && win.size?.width != null && win.size?.height != null) {
        const fit = fitRectToViewport(
          { x: position.x, y: position.y, width: win.size.width, height: win.size.height },
          viewport,
        );
        win.position = { x: fit.x, y: fit.y };
        win.size = { width: fit.width, height: fit.height };
      } else if (viewport) {
        win.position = {
          x: Math.max(SAFE_MARGIN, Math.min(position.x, viewport.width - SAFE_MARGIN)),
          y: Math.max(SAFE_MARGIN, Math.min(position.y, viewport.height - SAFE_MARGIN)),
        };
      } else {
        win.position = position;
      }
    },

    // Update window size (for resizable windows / tab switches)
    windowUpdateSize(
      state,
      action: PayloadAction<{
        windowId: string;
        size: { width: number; height: number };
        viewport?: Viewport;
      }>,
    ) {
      const { windowId, size, viewport } = action.payload;
      const win = state.windows[windowId];
      if (!win) return;

      if (viewport && win.position) {
        const fit = fitRectToViewport(
          { x: win.position.x, y: win.position.y, width: size.width, height: size.height },
          viewport,
        );
        win.position = { x: fit.x, y: fit.y };
        win.size = { width: fit.width, height: fit.height };
      } else {
        win.size = size;
      }
    },

    // Re-fit every non-fullscreen, non-minimized window into the (possibly
    // resized) viewport. Dispatched on browser resize.
    windowReflowAll(state, action: PayloadAction<{ viewport: Viewport }>) {
      const { viewport } = action.payload;
      for (const win of Object.values(state.windows)) {
        if (win.isFullScreen || win.isMinimized) continue;
        if (!win.position || win.size?.width == null || win.size?.height == null) continue;
        const fit = fitRectToViewport(
          { x: win.position.x, y: win.position.y, width: win.size.width, height: win.size.height },
          viewport,
        );
        win.position = { x: fit.x, y: fit.y };
        win.size = { width: fit.width, height: fit.height };
      }
    },

    // Bring window to front
    windowBringToFront(state, action: PayloadAction<{ windowId: string }>) {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (window) {
        window.zIndex = state.nextZIndex;
        state.nextZIndex += 1;
      }
    },

    // Minimize a window (hide it from the main area)
    windowMinimize(state, action: PayloadAction<{ windowId: string }>) {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (window) {
        window.isMinimized = true;
      }
    },

    // Restore a window (un-minimize)
    windowRestore(state, action: PayloadAction<{ windowId: string }>) {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (window) {
        window.isMinimized = false;
        // bring to front on restore
        window.zIndex = state.nextZIndex;
        state.nextZIndex += 1;
      }
    },

    // Toggle minimize state
    windowToggleMinimize(state, action: PayloadAction<{ windowId: string }>) {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (window) {
        window.isMinimized = !window.isMinimized;
        if (!window.isMinimized) {
          window.zIndex = state.nextZIndex;
          state.nextZIndex += 1;
        }
      }
    },

    // Toggle fullscreen (maximize/restore)
    windowToggleFullScreen(state, action: PayloadAction<{ windowId: string }>) {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (window) {
        window.isFullScreen = !window.isFullScreen;
        // bring to front when toggling
        window.zIndex = state.nextZIndex;
        state.nextZIndex += 1;
      }
    },

    // Explicitly set fullscreen
    windowSetFullScreen(
      state,
      action: PayloadAction<{ windowId: string; isFullScreen: boolean }>,
    ) {
      const { windowId, isFullScreen } = action.payload;
      const window = state.windows[windowId];
      if (window) {
        window.isFullScreen = isFullScreen;
        window.zIndex = state.nextZIndex;
        state.nextZIndex += 1;
      }
    },

    // Close all windows
    windowCloseAll(state) {
      state.windows = {};
    },
  },
});

export const {
  windowOpen,
  windowClose,
  windowUpdatePosition,
  windowUpdateSize,
  windowReflowAll,
  windowBringToFront,
  windowMinimize,
  windowRestore,
  windowToggleMinimize,
  windowToggleFullScreen,
  windowSetFullScreen,
  windowCloseAll,
  windowSetActiveTab,
  windowClearUiState,
} = windowsSlice.actions;

export const WindowsReducer = windowsSlice.reducer;

// Helper to escape user-provided strings when constructing regex
function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
