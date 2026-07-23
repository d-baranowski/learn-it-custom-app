/**
 * Form hooks — selectors and dispatch wrappers.
 *
 * Performance contract (see _plans/utr-000140-rhf-redux-design.md §6):
 *
 *   - Field-level hooks (useFieldValue, useFieldError, useFieldMeta) use
 *     per-field useSelector with default strict equality. On a keystroke,
 *     only the changed field's component re-renders.
 *
 *   - Aggregate hooks (useFormFlags) use shallowEqual to avoid spurious
 *     re-renders.
 *
 *   - useFormActions returns a stable, memoized object of dispatch helpers
 *     scoped to a formId.
 */

import { useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import type { RootState, AppDispatch } from '~/_lib/grid/state/store';
import {
  formsActions,
  FieldError,
  FieldMeta,
  FormStatus,
  FormReduxState,
  DraftIndexEntry,
} from './forms-slice';

// ──────────────────────────────────────────────────────────────────────────────
// Field-level selectors (the hot path — keep these as cheap as possible)
// ──────────────────────────────────────────────────────────────────────────────

export function useFieldValue<T = unknown>(formId: string, name: string): T | undefined {
  return useSelector(
    (s: RootState) => s.forms.byId[formId]?.values[name] as T | undefined
  );
}

export function useFieldError(formId: string, name: string): FieldError | undefined {
  return useSelector((s: RootState) => s.forms.byId[formId]?.errors[name]);
}

const EMPTY_META: FieldMeta = { isTouched: false, isDirty: false, isValidating: false };

export function useFieldMeta(formId: string, name: string): FieldMeta {
  return useSelector(
    (s: RootState) => s.forms.byId[formId]?.fields[name] ?? EMPTY_META,
    shallowEqual
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Form-level selectors
// ──────────────────────────────────────────────────────────────────────────────

export function useFormStatus(formId: string): FormStatus | undefined {
  return useSelector((s: RootState) => s.forms.byId[formId]?.status);
}

export interface FormFlags {
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  submitCount: number;
  exists: boolean;
}

const ABSENT_FLAGS: FormFlags = {
  isDirty: false,
  isValid: true,
  isSubmitting: false,
  isLoading: false,
  submitCount: 0,
  exists: false,
};

export function useFormFlags(formId: string): FormFlags {
  return useSelector(
    (s: RootState): FormFlags => {
      const f = s.forms.byId[formId];
      if (!f) return ABSENT_FLAGS;
      return {
        isDirty: f.isDirty,
        isValid: f.isValid,
        isSubmitting: f.status === 'submitting',
        isLoading: f.status === 'loading',
        submitCount: f.submitCount,
        exists: true,
      };
    },
    shallowEqual
  );
}

export function useFormActiveTabIndex(formId: string): number | undefined {
  return useSelector((s: RootState) => s.forms.byId[formId]?.uiState.activeTabIndex);
}

/**
 * Read the entire form record. Use sparingly — prefer per-field hooks.
 * Returns undefined if not present. Uses shallowEqual which is NOT enough
 * to prevent re-renders when nested objects change; mainly for inspection.
 */
export function useFormRecord(formId: string): FormReduxState | undefined {
  return useSelector((s: RootState) => s.forms.byId[formId]);
}

/**
 * True when there is any dirty form anywhere in the app.
 * Useful for global "you have unsaved changes" guards.
 */
export function useAnyFormDirty(): boolean {
  return useSelector((s: RootState) => {
    for (const id in s.forms.byId) {
      if (s.forms.byId[id].isDirty) return true;
    }
    return false;
  });
}

export function useFormDrafts(): DraftIndexEntry[] {
  return useSelector((s: RootState) => s.forms.drafts);
}

export function useFormIdForWindow(windowId: string): string | undefined {
  return useSelector((s: RootState) => s.forms.formIdByWindowId[windowId]);
}

// ──────────────────────────────────────────────────────────────────────────────
// Dispatch wrappers — useFormActions(formId)
// ──────────────────────────────────────────────────────────────────────────────

export interface FormActions {
  changeField: (name: string, value: unknown) => void;
  blurField: (name: string) => void;
  registerField: (name: string, defaultValue?: unknown, tabIndex?: number) => void;
  unregisterField: (name: string, opts?: { keepValue?: boolean }) => void;
  reset: (opts?: { values?: Record<string, unknown>; defaultValues?: Record<string, unknown> }) => void;
  setActiveTab: (index: number) => void;
  /**
   * Dispatch the submit-started action. The validation listener middleware
   * (Phase 1.6) handles the rest of the lifecycle.
   */
  submit: () => void;
  /** Force the form to be destroyed (with optional draft persistence). */
  destroy: (opts: { persistOnDismiss: boolean; forceDelete?: boolean }) => void;
  bindWindow: (windowId: string) => void;
  unbindWindow: (windowId: string) => void;
}

export function useFormActions(formId: string): FormActions {
  const dispatch = useDispatch<AppDispatch>();
  return useMemo<FormActions>(
    () => ({
      changeField: (name, value) =>
        dispatch(formsActions.fieldChanged({ formId, name, value })),
      blurField: (name) =>
        dispatch(formsActions.fieldBlurred({ formId, name })),
      registerField: (name, defaultValue, tabIndex) =>
        dispatch(formsActions.fieldRegistered({ formId, name, defaultValue, tabIndex })),
      unregisterField: (name, opts) =>
        dispatch(formsActions.fieldUnregistered({ formId, name, keepValue: opts?.keepValue })),
      reset: (opts) =>
        dispatch(formsActions.formReset({ formId, ...opts })),
      setActiveTab: (index) =>
        dispatch(formsActions.formActiveTabChanged({ formId, index })),
      submit: () =>
        dispatch(formsActions.formSubmitStarted({ formId })),
      destroy: (opts) =>
        dispatch(formsActions.formDestroyed({ formId, ...opts })),
      bindWindow: (windowId) =>
        dispatch(formsActions.windowBoundToForm({ windowId, formId })),
      unbindWindow: (windowId) =>
        dispatch(formsActions.windowUnboundFromForm({ windowId })),
    }),
    [dispatch, formId]
  );
}

/**
 * Top-level dispatch wrapper for actions that aren't scoped to a single form
 * (open form, discard draft, restore draft).
 */
export interface FormGlobalActions {
  discardDraft: (formId: string) => void;
  restoreDraftIntoWindow: (formId: string, windowId: string) => void;
}

export function useFormGlobalActions(): FormGlobalActions {
  const dispatch = useDispatch<AppDispatch>();
  return useMemo<FormGlobalActions>(
    () => ({
      discardDraft: (formId) =>
        dispatch(formsActions.draftDiscarded({ formId })),
      restoreDraftIntoWindow: (formId, windowId) =>
        dispatch(formsActions.draftRestoredInto({ formId, windowId })),
    }),
    [dispatch]
  );
}
