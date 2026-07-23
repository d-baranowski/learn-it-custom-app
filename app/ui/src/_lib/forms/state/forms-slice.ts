/**
 * forms-slice — Single source of truth for form state.
 *
 * Design: see _plans/utr-000140-rhf-redux-design.md (sections 4–5).
 *
 * Conventions:
 *   - Values are stored flat-keyed (`addresses.0.line1`), reconstructed
 *     to nested form only at the proto bridge boundary.
 *   - Per-field metadata is sparse — only fields that have been registered
 *     or touched have entries.
 *   - `lastInteractionAt` / `lastChangedAt`-style timestamps are NOT updated
 *     per-keystroke; updated on blur/lifecycle events to keep the per-field
 *     metadata object identity stable across rapid input.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import isEqual from 'lodash/isEqual';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type FormStatus =
  | 'loading'
  | 'ready'
  | 'submitting'
  | 'submitSuccess'
  | 'submitError'
  | 'draft';

export interface FieldError {
  type: string;
  message: string;
  path: string;
}

export interface FieldMeta {
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  /**
   * Index of the FormTab this field is rendered inside, or undefined if
   * not in a tabbed form. Set on register from the FormTabIndexContext.
   * Used to decide which tab(s) to badge with a validation error.
   */
  tabIndex?: number;
}

export interface FormReduxState {
  /** Identity */
  id: string;
  entityType: string;
  entityId: string | null;
  createNonce?: string;

  /** Lifecycle */
  status: FormStatus;
  mountedAt: number;
  lastInteractionAt: number;

  /** Schema-derived */
  protoTypeName: string;
  schemaVersion: number;
  defaultValues: Record<string, unknown>;

  /** Live values */
  values: Record<string, unknown>;

  /** Per-field metadata (sparse) */
  fields: Record<string, FieldMeta>;

  /** Form-wide computed flags */
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, FieldError>;
  formError: string | null;

  /** Submission */
  submitCount: number;
  submitError: string | null;

  /** Persistence */
  isDraft: boolean;
  draftSavedAt: number | null;

  /** UI state that travels with the form (e.g., across draft restore) */
  uiState: {
    activeTabIndex?: number;
  };
}

export interface DraftIndexEntry {
  formId: string;
  entityType: string;
  entityId: string | null;
  createdAt: number;
  lastInteractionAt: number;
  schemaVersion: number;
  label?: string;
}

export interface FormsState {
  byId: Record<string, FormReduxState>;
  formIdByWindowId: Record<string, string>;
  drafts: DraftIndexEntry[];
}

const initialState: FormsState = {
  byId: {},
  formIdByWindowId: {},
  drafts: [],
};

// ──────────────────────────────────────────────────────────────────────────────
// Action payloads
// ──────────────────────────────────────────────────────────────────────────────

export interface FormCreatedPayload {
  formId: string;
  entityType: string;
  entityId: string | null;
  createNonce?: string;
  protoTypeName: string;
  schemaVersion: number;
  defaultValues: Record<string, unknown>;
  /**
   * If true and the form's `status` would be 'loading' (entityId present),
   * defaultValues are still applied immediately so the UI renders something
   * before the entity fetch resolves.
   */
  showDefaultsWhileLoading?: boolean;
  /**
   * Whether a get query will fire and dispatch `formLoaded` shortly.
   *
   * Defaults to `entityId !== null` (preserves the original assumption that
   * any form with an entityId is editing an existing entity loaded over the
   * wire). Set to `false` for forms that have an entityId but no get query
   * — e.g., a password-reset form scoped to a user, where the user record
   * isn't fetched but the formId convention still encodes the user.
   */
  willLoad?: boolean;
}

export interface FormLoadedPayload {
  formId: string;
  values: Record<string, unknown>;
}

export interface FormLoadFailedPayload {
  formId: string;
  error: string;
}

export interface FieldChangedPayload {
  formId: string;
  name: string;
  value: unknown;
}

export interface FieldBlurredPayload {
  formId: string;
  name: string;
}

export interface FieldRegisteredPayload {
  formId: string;
  name: string;
  defaultValue?: unknown;
  /** Tab index the field is rendered inside, if any. */
  tabIndex?: number;
}

export interface FieldUnregisteredPayload {
  formId: string;
  name: string;
  /** If true, leaves `values[name]` in place; otherwise removes it. */
  keepValue?: boolean;
}

export interface ValidationStartedPayload {
  formId: string;
  names: string[];
}

export interface ValidationCompletedPayload {
  formId: string;
  /** Map of field name → error. Fields not in the map and not in
   * `validatedNames` keep their existing error (if any). Fields in
   * `validatedNames` but not in `errors` have their error cleared. */
  errors: Record<string, FieldError>;
  validatedNames: string[];
  /** Optional form-level error (path === '_form'). */
  formError?: string | null;
}

export interface FormResetPayload {
  formId: string;
  /** If provided, replace values; else use the form's defaultValues. */
  values?: Record<string, unknown>;
  /** If provided, also replace defaultValues (e.g., after a server reload
   * surfaces an updated entity). */
  defaultValues?: Record<string, unknown>;
}

export interface FormSubmitStartedPayload {
  formId: string;
}

export interface FormSubmitSucceededPayload {
  formId: string;
  /** Optional: caller may include the saved entity for downstream listeners. */
  savedEntity?: unknown;
}

export interface FormSubmitFailedPayload {
  formId: string;
  error: string;
}

export interface FormDestroyedPayload {
  formId: string;
  /** If true, persists as a draft when dirty; else hard-deletes. */
  persistOnDismiss: boolean;
  /** Override: hard-delete even if dirty (e.g., user picked "discard"). */
  forceDelete?: boolean;
}

export interface DraftDiscardedPayload {
  formId: string;
}

export interface DraftRestoredIntoPayload {
  formId: string;
  windowId: string;
}

export interface WindowBoundToFormPayload {
  windowId: string;
  formId: string;
}

export interface WindowUnboundFromFormPayload {
  windowId: string;
}

export interface FormActiveTabChangedPayload {
  formId: string;
  index: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const now = (): number => Date.now();

/**
 * Compute whether a single field's value differs from its default.
 * Uses deepEqual because complex field values (autocomplete-returned
 * objects, multi-selects) are compared by structural identity.
 */
function fieldValueIsDirty(value: unknown, defaultValue: unknown): boolean {
  return !isEqual(value, defaultValue);
}

/**
 * Recompute the form-level `isDirty` from the per-field flags.
 * Cheap: O(n) over the touched fields, which is small in practice.
 */
function recomputeFormDirty(form: FormReduxState): void {
  let dirty = false;
  for (const name in form.fields) {
    if (form.fields[name].isDirty) {
      dirty = true;
      break;
    }
  }
  form.isDirty = dirty;
}

function recomputeFormValid(form: FormReduxState): void {
  let hasError = form.formError !== null;
  if (!hasError) {
    for (const _ in form.errors) {
      hasError = true;
      break;
    }
  }
  form.isValid = !hasError;
}

function ensureField(form: FormReduxState, name: string): FieldMeta {
  let meta = form.fields[name];
  if (!meta) {
    meta = { isTouched: false, isDirty: false, isValidating: false };
    form.fields[name] = meta;
  }
  return meta;
}

function removeFromDraftIndex(state: FormsState, formId: string): void {
  const idx = state.drafts.findIndex((d) => d.formId === formId);
  if (idx >= 0) state.drafts.splice(idx, 1);
}

// ──────────────────────────────────────────────────────────────────────────────
// Slice
// ──────────────────────────────────────────────────────────────────────────────

const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    formCreated(state, action: PayloadAction<FormCreatedPayload>) {
      const {
        formId,
        entityType,
        entityId,
        createNonce,
        protoTypeName,
        schemaVersion,
        defaultValues,
        showDefaultsWhileLoading = true,
        willLoad,
      } = action.payload;

      // Existing record? If it's a draft for the same form, hydrate from the draft.
      const existing = state.byId[formId];
      const draftIdx = state.drafts.findIndex((d) => d.formId === formId);
      const restoringDraft = !!existing && existing.isDraft && draftIdx >= 0;

      // Default willLoad to "entityId is set" — preserves prior behavior.
      const willLoadResolved = willLoad ?? entityId !== null;
      const hasEntityToFetch = willLoadResolved && !restoringDraft;
      const t = now();

      const next: FormReduxState = {
        id: formId,
        entityType,
        entityId,
        ...(createNonce ? { createNonce } : {}),
        status: hasEntityToFetch ? 'loading' : 'ready',
        mountedAt: t,
        lastInteractionAt: t,
        protoTypeName,
        schemaVersion,
        defaultValues: { ...defaultValues },
        values: restoringDraft
          ? { ...existing.values }
          : showDefaultsWhileLoading || !hasEntityToFetch
          ? { ...defaultValues }
          : {},
        fields: restoringDraft ? { ...existing.fields } : {},
        isDirty: restoringDraft ? existing.isDirty : false,
        isValid: true,
        errors: {},
        formError: null,
        submitCount: 0,
        submitError: null,
        isDraft: false,
        draftSavedAt: null,
        uiState: restoringDraft ? { ...existing.uiState } : {},
      };

      state.byId[formId] = next;
      if (restoringDraft) {
        state.drafts.splice(draftIdx, 1);
      }
    },

    formLoaded(state, action: PayloadAction<FormLoadedPayload>) {
      const { formId, values } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      form.values = { ...values };
      form.defaultValues = { ...values };
      form.fields = {};
      form.isDirty = false;
      form.errors = {};
      form.formError = null;
      form.status = 'ready';
      form.lastInteractionAt = now();
      recomputeFormValid(form);
    },

    formLoadFailed(state, action: PayloadAction<FormLoadFailedPayload>) {
      const { formId, error } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      form.status = 'submitError';
      form.formError = error;
      recomputeFormValid(form);
    },

    fieldChanged(state, action: PayloadAction<FieldChangedPayload>) {
      const { formId, name, value } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      form.values[name] = value;
      const meta = ensureField(form, name);
      const wasDirty = meta.isDirty;
      meta.isDirty = fieldValueIsDirty(value, form.defaultValues[name]);
      if (wasDirty !== meta.isDirty) recomputeFormDirty(form);
    },

    fieldBlurred(state, action: PayloadAction<FieldBlurredPayload>) {
      const { formId, name } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      const meta = ensureField(form, name);
      meta.isTouched = true;
      form.lastInteractionAt = now();
    },

    fieldRegistered(state, action: PayloadAction<FieldRegisteredPayload>) {
      const { formId, name, defaultValue, tabIndex } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      const meta = ensureField(form, name);
      if (tabIndex !== undefined) meta.tabIndex = tabIndex;
      if (defaultValue !== undefined && form.values[name] === undefined) {
        form.values[name] = defaultValue;
        form.defaultValues[name] = defaultValue;
      }
    },

    fieldUnregistered(state, action: PayloadAction<FieldUnregisteredPayload>) {
      const { formId, name, keepValue } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      delete form.fields[name];
      if (!keepValue) delete form.values[name];
      delete form.errors[name];
      recomputeFormDirty(form);
      recomputeFormValid(form);
    },

    validationStarted(state, action: PayloadAction<ValidationStartedPayload>) {
      const { formId, names } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      for (const name of names) {
        const meta = ensureField(form, name);
        meta.isValidating = true;
      }
    },

    validationCompleted(state, action: PayloadAction<ValidationCompletedPayload>) {
      const { formId, errors, validatedNames, formError } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      // Clear isValidating for everything in validatedNames.
      for (const name of validatedNames) {
        const meta = ensureField(form, name);
        meta.isValidating = false;
        // If the field was validated and is not in errors, clear its existing error.
        if (!errors[name] && form.errors[name]) delete form.errors[name];
      }
      // Apply new errors.
      for (const name in errors) {
        form.errors[name] = errors[name];
      }
      if (formError !== undefined) form.formError = formError;
      recomputeFormValid(form);
    },

    formReset(state, action: PayloadAction<FormResetPayload>) {
      const { formId, values, defaultValues } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      if (defaultValues) form.defaultValues = { ...defaultValues };
      form.values = values
        ? { ...values }
        : { ...form.defaultValues };
      form.fields = {};
      form.errors = {};
      form.formError = null;
      form.isDirty = false;
      form.lastInteractionAt = now();
      recomputeFormValid(form);
    },

    formSubmitStarted(state, action: PayloadAction<FormSubmitStartedPayload>) {
      const form = state.byId[action.payload.formId];
      if (!form) return;
      form.status = 'submitting';
      form.submitCount += 1;
      form.submitError = null;
      form.lastInteractionAt = now();
    },

    formSubmitSucceeded(state, action: PayloadAction<FormSubmitSucceededPayload>) {
      const form = state.byId[action.payload.formId];
      if (!form) return;
      form.status = 'submitSuccess';
      // Reset dirty so a subsequent formDestroyed doesn't persist this as a
      // draft — the entity has just been saved server-side.
      form.isDirty = false;
      for (const k in form.fields) form.fields[k].isDirty = false;
      // Drop any draft for this formId since the entity is now persisted.
      removeFromDraftIndex(state, form.id);
    },

    formSubmitFailed(state, action: PayloadAction<FormSubmitFailedPayload>) {
      const form = state.byId[action.payload.formId];
      if (!form) return;
      form.status = 'submitError';
      form.submitError = action.payload.error;
    },

    formDestroyed(state, action: PayloadAction<FormDestroyedPayload>) {
      const { formId, persistOnDismiss, forceDelete } = action.payload;
      const form = state.byId[formId];
      if (!form) return;

      // Drop window binding regardless.
      for (const wid in state.formIdByWindowId) {
        if (state.formIdByWindowId[wid] === formId) {
          delete state.formIdByWindowId[wid];
        }
      }

      const shouldPersist =
        persistOnDismiss && !forceDelete && form.isDirty;

      if (shouldPersist) {
        const t = now();
        form.status = 'draft';
        form.isDraft = true;
        form.draftSavedAt = t;
        // Add to drafts index (replace any prior entry for this formId).
        removeFromDraftIndex(state, formId);
        state.drafts.push({
          formId,
          entityType: form.entityType,
          entityId: form.entityId,
          createdAt: t,
          lastInteractionAt: form.lastInteractionAt,
          schemaVersion: form.schemaVersion,
        });
      } else {
        delete state.byId[formId];
        removeFromDraftIndex(state, formId);
      }
    },

    draftDiscarded(state, action: PayloadAction<DraftDiscardedPayload>) {
      const { formId } = action.payload;
      delete state.byId[formId];
      removeFromDraftIndex(state, formId);
    },

    draftRestoredInto(state, action: PayloadAction<DraftRestoredIntoPayload>) {
      const { formId, windowId } = action.payload;
      const form = state.byId[formId];
      if (!form) return;
      form.status = 'ready';
      form.isDraft = false;
      form.draftSavedAt = null;
      removeFromDraftIndex(state, formId);
      state.formIdByWindowId[windowId] = formId;
    },

    windowBoundToForm(state, action: PayloadAction<WindowBoundToFormPayload>) {
      state.formIdByWindowId[action.payload.windowId] = action.payload.formId;
    },

    windowUnboundFromForm(state, action: PayloadAction<WindowUnboundFromFormPayload>) {
      delete state.formIdByWindowId[action.payload.windowId];
    },

    formActiveTabChanged(state, action: PayloadAction<FormActiveTabChangedPayload>) {
      const form = state.byId[action.payload.formId];
      if (!form) return;
      form.uiState.activeTabIndex = action.payload.index;
    },

    /**
     * Bulk-replace the drafts index. Used at boot when the persistence layer
     * hydrates from localStorage.
     */
    draftsHydrated(state, action: PayloadAction<{ drafts: DraftIndexEntry[]; byId: Record<string, FormReduxState> }>) {
      state.drafts = action.payload.drafts;
      // Merge byId entries (don't clobber any in-memory live forms).
      for (const id in action.payload.byId) {
        if (!state.byId[id]) {
          state.byId[id] = action.payload.byId[id];
        }
      }
    },
  },
});

export const FormsReducer = formsSlice.reducer;
export const formsActions = formsSlice.actions;
