/**
 * validation-middleware — RTK listener middleware that drives the
 * validation + submission lifecycle.
 *
 * Responsibilities:
 *   1. On `fieldBlurred`: validate that single field via the form's resolver.
 *      Dispatch validationStarted → validationCompleted with the result.
 *   2. On `formSubmitStarted`: validate all fields. If clean, invoke the
 *      runtime's submitHandler. Dispatch validationCompleted +
 *      formSubmitSucceeded / formSubmitFailed accordingly.
 *
 * Reads non-Redux per-form state (resolver, submitHandler) from the
 * form-runtime-registry singleton.
 *
 * Field-blur validation is debounced per-form-per-field (200ms) to avoid
 * thrashing the resolver during rapid blur sequences (e.g., tab-key
 * traversal across multiple fields).
 */

import { createListenerMiddleware, isAnyOf, TaskAbortError } from '@reduxjs/toolkit';
import type { RootState } from '~/_lib/grid/state/store';
import { formsActions, FieldError } from './forms-slice';
import { getFormRuntime } from '../runtime/form-runtime-registry';

const FIELD_BLUR_DEBOUNCE_MS = 200;

export const formValidationMiddleware = createListenerMiddleware();

const startListening = formValidationMiddleware.startListening.withTypes<
  RootState,
  // We don't bind a typed dispatch here because it's awkward with
  // listenerMiddleware generics; use plain dispatch and rely on action types.
  any
>();

// ──────────────────────────────────────────────────────────────────────────────
// Field-blur → single-field validation
// ──────────────────────────────────────────────────────────────────────────────

startListening({
  actionCreator: formsActions.fieldBlurred,
  effect: async (action, api) => {
    const { formId, name } = action.payload;
    const runtime = getFormRuntime(formId);
    if (!runtime) return;

    // Cancel any in-flight blur validation for the same field on the same form.
    api.cancelActiveListeners();

    try {
      await api.delay(FIELD_BLUR_DEBOUNCE_MS);
    } catch (e) {
      // Cancelled by a newer fieldBlurred for this field — drop this run.
      if (e instanceof TaskAbortError) return;
      throw e;
    }

    const state = api.getState();
    const form = state.forms.byId[formId];
    if (!form) return;

    api.dispatch(formsActions.validationStarted({ formId, names: [name] }));

    let result: FieldError | null = null;
    try {
      result = await runtime.resolver.validateField(
        name,
        form.values[name],
        form.values
      );
    } catch (err) {
      // Resolver crashed — surface as field error rather than blowing up.
      const message = err instanceof Error ? err.message : String(err);
      result = { type: 'resolver_error', message, path: name };
    }

    api.dispatch(
      formsActions.validationCompleted({
        formId,
        validatedNames: [name],
        errors: result ? { [name]: result } : {},
      })
    );
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Submit started → validate all → invoke handler
// ──────────────────────────────────────────────────────────────────────────────

startListening({
  actionCreator: formsActions.formSubmitStarted,
  effect: async (action, api) => {
    const { formId } = action.payload;
    const runtime = getFormRuntime(formId);
    if (!runtime) return;

    const state = api.getState();
    const form = state.forms.byId[formId];
    if (!form) return;

    // Validate all known fields.
    const validatedNames = Object.keys(form.fields);

    let errors: Record<string, FieldError> = {};
    try {
      errors = await runtime.resolver.validateAll(form.values);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      api.dispatch(
        formsActions.validationCompleted({
          formId,
          validatedNames,
          errors: {},
          formError: message,
        })
      );
      api.dispatch(formsActions.formSubmitFailed({ formId, error: message }));
      return;
    }

    // Surface a form-level error if the resolver reported one under '_form'.
    const formLevelError = errors['_form']?.message ?? null;
    const fieldErrors: Record<string, FieldError> = { ...errors };
    delete fieldErrors['_form'];

    api.dispatch(
      formsActions.validationCompleted({
        formId,
        validatedNames,
        errors: fieldErrors,
        formError: formLevelError,
      })
    );

    if (Object.keys(fieldErrors).length > 0 || formLevelError) {
      runtime.focusFirstError(Object.keys(fieldErrors));
      // Field error messages are already translated by the resolver
      // (wasm-resolver translate()); surface them as the submit error so the
      // toast shows the specific, localized reason rather than a generic label.
      const fieldMessages = Object.values(fieldErrors)
        .map((e) => e.message)
        .filter((m): m is string => typeof m === 'string' && m.length > 0);
      api.dispatch(
        formsActions.formSubmitFailed({
          formId,
          error:
            formLevelError ??
            (fieldMessages.length > 0
              ? fieldMessages.join('\n')
              : 'Validation failed'),
        })
      );
      return;
    }

    // Validation clean — invoke the submit handler.
    if (!runtime.submitHandler) {
      api.dispatch(
        formsActions.formSubmitFailed({
          formId,
          error: 'No submit handler registered for form ' + formId,
        })
      );
      return;
    }

    try {
      const saved = await runtime.submitHandler(form.values);
      api.dispatch(formsActions.formSubmitSucceeded({ formId, savedEntity: saved }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      api.dispatch(formsActions.formSubmitFailed({ formId, error: message }));
    }
  },
});
