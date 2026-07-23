import * as React from 'react';
import { useWindowById } from '~/_lib/window/state/hooks';

export interface Dialog2ContentSize {
  width?: number;
  height?: number;
  isFullScreen: boolean;
}

const Dialog2SizeContext = React.createContext<Dialog2ContentSize | null>(null);

export function Dialog2SizeProvider(props: {
  windowId: string;
  children: React.ReactNode;
}) {
  const windowState = useWindowById(props.windowId);

  const width = windowState?.size?.width;
  const height = windowState?.size?.height;
  const isFullScreen = windowState?.isFullScreen || false;

  const result = React.useMemo(
    () => ({ width, height, isFullScreen }),
    [width, height, isFullScreen],
  );

  return (
    <Dialog2SizeContext.Provider value={result}>
      {props.children}
    </Dialog2SizeContext.Provider>
  );
}

/**
 * Access the current `Dialog2` content size.
 *
 * Must be used under a `Dialog2SizeProvider` (i.e. inside `Dialog2`).
 */
export function useDialog2Size(): Dialog2ContentSize {
  const ctx = React.useContext(Dialog2SizeContext);
  if (!ctx) {
    throw new Error('useDialog2Size must be used within Dialog2');
  }
  return ctx;
}

