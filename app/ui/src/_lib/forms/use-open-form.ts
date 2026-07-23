/**
 * useOpenForm — open a form via the window manager, with formId-based
 * deduplication.
 *
 * Replaces the legacy hooks/use-open-form.ts for the new forms framework.
 * Differences:
 *   - Takes typed `entityType` + `entityId` (catches the bug class where
 *     `id` was lost in formProps mapping).
 *   - Computes a stable `formId` and stores it in the window's formProps
 *     so the rendered <Form> can pick it up.
 *   - If a window already exists for the same formId, focuses it instead
 *     of opening a duplicate.
 */

import { useCallback, useMemo } from 'react';
import { useStore } from 'react-redux';
import type { Breakpoint } from '@mui/material';

import type { RootState } from '~/_lib/grid/state/store';
import { useWindowActions } from '~/_lib/window/state/hooks';
import { subscribeRpgWindowEvent } from '~/_lib/window/window-events';

import { makeFormId } from './components/form-id';

export interface OpenFormArgs<T = unknown> {
  /** Form component name as registered in the FormRegistry. */
  formName: string;

  /** Entity grouping for the formId convention. */
  entityType: string;

  /** null = create form; else edit form for that entity. */
  entityId: string | null;

  /** Title shown in the window chrome. */
  title: string;

  /** Optional explicit formId — overrides the computed one. */
  formId?: string;

  /** Extra props passed to the rendered form component. */
  formProps?: Record<string, unknown>;

  /**
   * Runs after each successful save of this form, receiving the saved entity.
   * Bridged over the `rpg:window:saved` event (functions can't cross Redux),
   * scoped to this form's `formId`. Bound at first open; for update forms it
   * fires on every save while open; auto-cleaned when the window closes.
   */
  afterSave?: (saved: T) => void;

  /** Window chrome options. */
  maxWidth?: Breakpoint;
  isFullScreen?: boolean;
  draggable?: boolean;
  /** Initial dialog height in px. Defaults to 700 — enough for tabbed forms. */
  initialHeight?: number;
  /** Initial dialog width in px. Overrides maxWidth's breakpoint when set. */
  initialWidth?: number;
}

export interface UseOpenFormResult {
  /** Opens (or focuses) a form. */
  openForm: <T = unknown>(args: OpenFormArgs<T>) => void;
}

export function useOpenForm(): UseOpenFormResult {
  const { openWindow, bringWindowToFront } = useWindowActions();
  // Read the live windows state at click time — closing over a useSelector
  // snapshot would dedup against a stale entry (e.g. clicking a row, the
  // dialog opens, the user cancels, they click the same row again — the
  // grid component hadn't re-rendered between close and reopen, so the
  // selector snapshot still listed the just-closed window and
  // bringWindowToFront was a no-op).
  const store = useStore<RootState>();

  const openForm = useCallback(
    <T = unknown>(args: OpenFormArgs<T>) => {
      const formId =
        args.formId ?? makeFormId({ entityType: args.entityType, entityId: args.entityId });

      // If a window is already showing this formId, focus it. The existing
      // window keeps its afterSave listener (bound at first open), so we do
      // not re-register here.
      const windows = store.getState().windows.windows ?? {};
      const existing = Object.entries(windows).find(
        ([, w]) => w.formProps?.formId === formId
      );
      if (existing) {
        bringWindowToFront(existing[0]);
        return;
      }

      // Bridge the caller's afterSave over the window-saved event, scoped to
      // this formId (functions can't be stored in Redux formProps).
      if (args.afterSave) {
        const cb = args.afterSave;
        const isCreate = args.entityId === null;
        let unsubSaved: () => void = () => {};
        let unsubClosed: () => void = () => {};
        const teardown = () => {
          unsubSaved();
          unsubClosed();
        };
        unsubSaved = subscribeRpgWindowEvent('rpg:window:saved', (event) => {
          if (event.detail.formId !== formId) return;
          cb(event.detail.data as T);
          // Create forms auto-close after saving and never emit a closed
          // event, so tear the listener down here.
          if (isCreate) teardown();
        });
        unsubClosed = subscribeRpgWindowEvent('rpg:window:closed', (event) => {
          if (event.detail.formId === formId) teardown();
        });
      }

      openWindow({
        formName: args.formName,
        title: args.title,
        formProps: {
          ...(args.formProps ?? {}),
          formId,
          // Mirror the typed args inside formProps so the <Form> component
          // can pick them up without separate props plumbing. `id` stays
          // populated for backward compatibility with form components that
          // destructure `{id}` (the convention before this hook existed).
          entityType: args.entityType,
          entityId: args.entityId,
          id: args.entityId ?? undefined,
        },
        maxWidth: args.maxWidth ?? 'md',
        isFullScreen: args.isFullScreen ?? false,
        draggable: args.draggable ?? true,
        initialHeight: args.initialHeight ?? 700,
        initialWidth: args.initialWidth,
      });
    },
    [bringWindowToFront, openWindow, store]
  );

  return useMemo(() => ({ openForm }), [openForm]);
}
