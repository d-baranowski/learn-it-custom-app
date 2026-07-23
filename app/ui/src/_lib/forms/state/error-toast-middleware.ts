/**
 * error-toast-middleware — surface form-level errors as user-visible toasts.
 *
 * Listens for:
 *   - `formSubmitFailed` — the single surface for submit-time errors, whether
 *     from failed validation (message carries the translated field reasons) or
 *     a thrown submit handler.
 *   - `formLoadFailed`
 *
 * Submit-time validation errors are NOT toasted off `validationCompleted`:
 * that action fires on every blur too, and toasting there both double-fired
 * with `formSubmitFailed` and leaked the generic fallback label. The submit
 * flow now folds the translated field reasons into the `formSubmitFailed`
 * payload, so a single listener owns the toast.
 *
 * Doesn't decide messaging text per-entity (that's a Phase 3 concern when
 * forms migrate and might want overrides). The toast surfaces the error
 * string from the action payload.
 *
 * Replaces the per-form try/catch toast pattern in BaseForm + the
 * useFormErrorToast hook.
 */

import { createListenerMiddleware } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import type { RootState } from '~/_lib/grid/state/store';
import { formsActions } from './forms-slice';

export const formErrorToastMiddleware = createListenerMiddleware();

const start = formErrorToastMiddleware.startListening.withTypes<RootState, any>();

start({
  actionCreator: formsActions.formSubmitFailed,
  effect: (action) => {
    toast.error(action.payload.error);
  },
});

start({
  actionCreator: formsActions.formLoadFailed,
  effect: (action) => {
    toast.error(action.payload.error);
  },
});
