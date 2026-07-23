import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useWindows, useWindowActions } from '~/_lib/window/state/hooks';
import Dialog2 from '~/components/dialog/dialog2';
import { WindowReduxState } from '~/_lib/window/state/windows-slice';
import Dialog2Backdrop from '../dialog/dialog2-backdrop';
import { useFormRegistryContext } from '~/providers/form-registry';
import WindowTaskbar from '~/components/rpg-window-manager/window-taskbar';
import { dispatchRpgWindowEvent } from '~/_lib/window/window-events';
import RpgWindowDebugDialog from './rpg-window-debug-dialog';
import { Breakpoint } from '@mui/material';

const WindowManagerFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div role="alert" style={{ padding: 16 }}>
    <strong>Window manager crashed.</strong>
    <div
      style={{ marginTop: 8, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
    >
      {error.message}
    </div>
  </div>
);

interface WindowEntryProps {
  windowId: string;
  formName: string;
  title: string;
  isOpen: boolean;
  maxWidth?: Breakpoint;
  isFullScreen?: boolean;
  draggable?: boolean;
  formProps?: Record<string, any>;
}

const WindowEntry = React.memo<WindowEntryProps>(function WindowEntry({
  windowId,
  formName,
  title,
  isOpen,
  maxWidth,
  isFullScreen,
  draggable,
  formProps,
}) {
  const { closeWindow } = useWindowActions();
  const { getFormComponent } = useFormRegistryContext();

  const handleClose = React.useCallback(() => {
    dispatchRpgWindowEvent('rpg:window:closed', {
      windowId,
      formName,
      title,
      formId: formProps?.formId,
    });
    closeWindow(windowId);
  }, [windowId, formName, title, formProps, closeWindow]);

  const handleAfterSave = React.useCallback((formData: Record<string, any>) => {
    dispatchRpgWindowEvent('rpg:window:saved', {
      windowId,
      formName,
      title,
      formId: formProps?.formId,
      data: formData,
    });
    const isUpdate = formProps?.entityId != null;
    if (!isUpdate) {
      closeWindow(windowId);
    }
  }, [windowId, formName, title, formProps, closeWindow]);

  const FormComponent = getFormComponent(formName);

  if (!FormComponent) {
    console.warn(
      `Form component "${formName}" not found in registry. ` +
        `Please register it using the form registry context before opening the window.`
    );
    return null;
  }

  return (
    <Dialog2
      windowId={windowId}
      title={title}
      isOpen={isOpen}
      close={handleClose}
      initialWidth={maxWidth}
      isFullScreen={isFullScreen}
      draggable={draggable}
    >
      <FormComponent
        {...(formProps || {})}
        windowId={windowId}
        onCancel={handleClose}
        afterSave={handleAfterSave}
      />
    </Dialog2>
  );
});

/**
 * Window close, dirty-aware.
 *
 * If the closing window is bound to a Redux-backed form (via the
 * formIdByWindowId index in `forms` slice) and that form is dirty,
 * we *don't* short-circuit here — we let the close go through and the
 * <Form> unmount handler dispatches `formDestroyed` which converts the
 * record to a draft (since persistOnDismiss defaults to true).
 *
 * The user-prompt "save as draft? / discard?" UX (design §11.2) is
 * deferred to Phase 2.9. Right now: silent draft on dismiss.
 */
const RpgWindowManager: React.FC = () => {
  const windows = useWindows();
  const { reflowAllWindows } = useWindowActions();
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => reflowAllWindows(), 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [reflowAllWindows]);

  const windowsList = Object.values(windows);

  return (
    <ErrorBoundary
      onReset={console.log}
      onError={console.log}
      FallbackComponent={WindowManagerFallback}
    >
      <Dialog2Backdrop isOpen={windowsList.some((w) => !w.isMinimized)}>
        {windowsList
          .filter((window: WindowReduxState) => !window.isMinimized)
          .map((window: WindowReduxState) => (
            <WindowEntry
              key={window.id}
              windowId={window.id}
              formName={window.formName}
              title={window.title}
              isOpen={window.isOpen}
              maxWidth={window.maxWidth}
              isFullScreen={window.isFullScreen}
              draggable={window.draggable}
              formProps={window.formProps}
            />
          ))}
      </Dialog2Backdrop>

      <WindowTaskbar />
      <RpgWindowDebugDialog />
    </ErrorBoundary>
  );
};

export default RpgWindowManager;
