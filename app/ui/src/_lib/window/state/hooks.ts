import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '~/_lib/grid/state/store';
import {
  windowOpen,
  windowClose,
  windowUpdatePosition,
  windowUpdateSize,
  windowReflowAll,
  windowBringToFront,
  windowCloseAll,
  windowMinimize,
  windowRestore,
  windowToggleMinimize,
  windowToggleFullScreen,
  windowSetFullScreen,
  windowSetActiveTab,
  windowClearUiState,
} from './windows-slice';
import { getViewportSize } from './fit_rect_to_viewport';
import { Breakpoint } from '@mui/material';
import { nanoid } from 'nanoid';

export const useWindows = () => {
  const windows = useSelector((state: RootState) => state.windows?.windows || {});
  return windows;
};

export const useWindowActions = () => {
  const dispatch = useDispatch();

  return {
    openWindow: (params: {
      formName: string;
      title: string;
      maxWidth?: Breakpoint;
      isFullScreen?: boolean;
      draggable?: boolean;
      formProps?: Record<string, any>;
      windowId?: string;
      initialHeight?: number;
      initialWidth?: number;
    }) => {
      const cleanedFormProps = params.formProps
        ? Object.fromEntries(
            Object.entries(params.formProps).filter(([, v]) => typeof v !== 'function'),
          )
        : undefined;

      dispatch(
        windowOpen({
          ...params,
          initialHeight: params.initialHeight,
          windowId: params.windowId || nanoid(),
          formProps: cleanedFormProps,
          viewport: getViewportSize(),
        }),
      );
    },
    closeWindow: (windowId: string) => {
      dispatch(windowClose({windowId}));
    },
    updateWindowPosition: (windowId: string, position: {x: number; y: number}) => {
      dispatch(windowUpdatePosition({windowId, position, viewport: getViewportSize()}));
    },
    updateWindowSize: (windowId: string, size: {width: number; height: number}) => {
      dispatch(windowUpdateSize({windowId, size, viewport: getViewportSize()}));
    },
    reflowAllWindows: () => {
      dispatch(windowReflowAll({viewport: getViewportSize()}));
    },
    bringWindowToFront: (windowId: string) => {
      dispatch(windowBringToFront({windowId}));
    },
    closeAllWindows: () => {
      dispatch(windowCloseAll());
    },
    minimizeWindow: (windowId: string) => {
      dispatch(windowMinimize({windowId}));
    },
    restoreWindow: (windowId: string) => {
      dispatch(windowRestore({windowId}));
    },
    toggleMinimizeWindow: (windowId: string) => {
      dispatch(windowToggleMinimize({windowId}));
    },
    toggleFullScreenWindow: (windowId: string) => {
      dispatch(windowToggleFullScreen({windowId}));
    },
    setFullScreenWindow: (windowId: string, isFullScreen: boolean) => {
      dispatch(windowSetFullScreen({windowId, isFullScreen}));
    },
    setWindowActiveTab: (windowId: string, tabIndex: number) => {
      dispatch(windowSetActiveTab({windowId, tabIndex}));
    },
    clearWindowUiState: (windowId: string) => {
      dispatch(windowClearUiState({windowId}));
    },
  };
};

export const useWindowById = (windowId: string) => {
  return useSelector((state: RootState) => state.windows?.windows?.[windowId]);
};

export const useWindowActiveTabIndex = (windowId: string) => {
  return useSelector(
    (state: RootState) => state.windows?.windows?.[windowId]?.ui?.activeTabIndex ?? 0,
  );
};
