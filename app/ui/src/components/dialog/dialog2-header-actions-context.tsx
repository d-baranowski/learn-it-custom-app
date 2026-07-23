import * as React from 'react';

interface Dialog2HeaderActionsContextValue {
  /** Register a ReactNode to be rendered in the Dialog2 header. */
  setHeaderActions: (node: React.ReactNode) => void;
}

const Dialog2HeaderActionsContext =
  React.createContext<Dialog2HeaderActionsContextValue | null>(null);

/**
 * Provider that Dialog2 wraps around its children.
 * Exposes a setter so descendants can inject actions into the header.
 */
export function Dialog2HeaderActionsProvider(props: {
  onActions: (node: React.ReactNode) => void;
  children: React.ReactNode;
}) {
  const value = React.useMemo<Dialog2HeaderActionsContextValue>(
    () => ({ setHeaderActions: props.onActions }),
    [props.onActions],
  );

  return (
    <Dialog2HeaderActionsContext.Provider value={value}>
      {props.children}
    </Dialog2HeaderActionsContext.Provider>
  );
}

/**
 * Hook for form components to inject actions into the nearest Dialog2 header.
 * Call with a ReactNode; the node will appear in the header beside the title.
 * Automatically cleans up on unmount.
 */
export function useDialogHeaderActions(node: React.ReactNode): void {
  const ctx = React.useContext(Dialog2HeaderActionsContext);
  React.useEffect(() => {
    ctx?.setHeaderActions(node);
    return () => {
      ctx?.setHeaderActions(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, node]);
}
