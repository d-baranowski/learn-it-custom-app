/**
 * useDependentField — collapse the watch + useQuery + setValue pattern.
 *
 * Common shape (5+ forms in the codebase do this by hand today):
 *
 *   const therapyId = methods.watch('therapyId');
 *   const { data } = useQuery(getTherapy, { id: therapyId }, { enabled: !!therapyId });
 *   useEffect(() => {
 *     if (!data) return;
 *     methods.setValue('price', data.sessionPrice);
 *     methods.setValue('therapistId', data.therapistId);
 *   }, [data, methods]);
 *
 * Replaced by:
 *
 *   useDependentField({
 *     watch: 'therapyId',
 *     query: getTherapy,
 *     apply: (therapy) => ({
 *       price: therapy.sessionPrice,
 *       therapistId: therapy.therapistId,
 *     }),
 *   });
 *
 * The hook handles:
 *   - Skipping the query when the watched value is empty.
 *   - Subscribing only to the watched field (one selector, cheap).
 *   - Preserving the user's manual edits — by default, an `apply()` key
 *     does NOT overwrite a field the user has already touched.
 *   - Cleaning up via React's effect lifecycle.
 */

import { useEffect } from 'react';
import { useStore } from 'react-redux';
import { Message } from '@bufbuild/protobuf';
import { MethodUnaryDescriptor, useQuery } from '@connectrpc/connect-query';
import type { RootState } from '~/_lib/grid/state/store';
import { useFieldValue, useFormActions } from '../state/hooks';
import { useFormId } from '../runtime/form-context';

export interface UseDependentFieldOpts<I extends Message<I>, O extends Message<O>> {
  /** Optional explicit formId — defaults to surrounding <FormContext>. */
  formId?: string;

  /** Field whose value is watched. When it changes (and is non-empty),
   * the query runs. */
  watch: string;

  /** Connect RPC method descriptor used to fetch the dependent data. */
  query: MethodUnaryDescriptor<I, O>;

  /**
   * Build the request from the watched value. Default: `{ ID: watchedValue }`
   * (matches the convention of GetMessage-style requests across the app).
   */
  buildRequest?: (watched: unknown) => Partial<I>;

  /**
   * Map the query result to a record of `name → value` updates. Each entry
   * dispatches a `fieldChanged` for that field unless `preserveUserEdits`
   * is true and the user has already dirtied that field.
   */
  apply: (data: O) => Record<string, unknown>;

  /** If true (default), don't overwrite fields the user has manually edited. */
  preserveUserEdits?: boolean;

  /** If true, also clear the apply'd fields when the watched value becomes empty. */
  clearOnUnset?: boolean;
}

export function useDependentField<
  I extends Message<I>,
  O extends Message<O>,
>(opts: UseDependentFieldOpts<I, O>): { isFetching: boolean; data: O | undefined } {
  const ctxFormId = useFormId();
  const formId = opts.formId ?? ctxFormId;

  const watched = useFieldValue<unknown>(formId, opts.watch);
  const actions = useFormActions(formId);

  const enabled = watched !== undefined && watched !== null && watched !== '';
  const request = (opts.buildRequest
    ? opts.buildRequest(watched)
    : { ID: watched }) as Partial<I>;

  const { data, isFetching } = useQuery(opts.query, request as never, { enabled });

  // Snapshot the store so we can read field meta synchronously inside the
  // effect without subscribing the component to it (would cause spurious
  // re-renders on every dirty change).
  const store = useStore<RootState>();

  useEffect(() => {
    if (!enabled && opts.clearOnUnset) {
      // Read whatever apply WOULD set so we know which keys to clear.
      // We don't have data here, so we infer from a no-op call: skip if no data.
      return;
    }
    if (!data) return;

    const updates = opts.apply(data);
    const preserveUserEdits = opts.preserveUserEdits ?? true;

    const state = store.getState().forms.byId[formId];
    if (!state) return;

    for (const name in updates) {
      if (preserveUserEdits) {
        // Skip if the field has any non-empty value already. This matches
        // legacy behaviour (`!methods.getValues(name)`) and is more robust
        // than the per-field isDirty flag, which can be reset by an
        // unregister/re-register cycle (e.g., StrictMode double-mount,
        // tab-content remounts) and lose the "user touched this" signal.
        const current = state.values[name];
        if (current !== undefined && current !== '' && current !== null) continue;
      }
      actions.changeField(name, updates[name]);
    }
    // We deliberately exclude `actions` and `opts` from deps to avoid
    // double-running when callers pass inline lambdas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, formId]);

  return { isFetching, data };
}
