/**
 * useFormController — per-field binding hook for the new forms framework.
 *
 * Returns `{field, fieldState}` with the same shape RHF's useController used
 * to expose: `field.value`, `field.onChange`, `fieldState.error` etc. Field
 * components in `~/components/form/elements/` build on this hook.
 *
 * Reads value/error/meta via per-field selectors (cheap), and dispatches
 * change/blur/register/unregister actions to Redux.
 */

import { useCallback, useContext, useEffect, useRef } from 'react';
import {
  useFieldValue,
  useFieldError,
  useFieldMeta,
  useFormActions,
} from '../state/hooks';
import { getFormRuntime } from './form-runtime-registry';
import type { FieldError, FieldMeta } from '../state/forms-slice';
import { FormTabIndexContext } from '../components/form-tabs';

export interface UseFormControllerOpts<T = unknown> {
  formId: string;
  name: string;
  /** Default value applied via fieldRegistered if values[name] is absent. */
  defaultValue?: T;
  /**
   * Whether to keep the stored value when the bound component unmounts.
   * Default true. Reasons to keep:
   *   - StrictMode runs setup→cleanup→setup on initial mount; clearing the
   *     value on cleanup would wipe data that `formLoaded` just set.
   *   - Tab switches in <FormTabs> keep tab content mounted today, but
   *     anything that toggles `display: none` could become an unmount
   *     boundary in the future.
   * Pass `false` only when a field is conditionally removed and you want
   * its value gone with it (rare).
   */
  keepValueOnUnmount?: boolean;
}

export interface FieldController<T = unknown> {
  field: {
    name: string;
    value: T | undefined;
    onChange: (value: T) => void;
    onBlur: () => void;
    ref: (el: HTMLElement | null) => void;
  };
  fieldState: {
    error: FieldError | undefined;
    invalid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValidating: boolean;
  };
  meta: FieldMeta;
}

export function useFormController<T = unknown>(
  opts: UseFormControllerOpts<T>
): FieldController<T> {
  const { formId, name, defaultValue, keepValueOnUnmount = true } = opts;

  const value = useFieldValue<T>(formId, name);
  const error = useFieldError(formId, name);
  const meta = useFieldMeta(formId, name);
  const actions = useFormActions(formId);
  const tabIndex = useContext(FormTabIndexContext);

  // Latest defaultValue ref so the registration effect uses the current
  // value at mount time without forcing a re-register on every render.
  const defaultValueRef = useRef(defaultValue);
  defaultValueRef.current = defaultValue;
  const tabIndexRef = useRef(tabIndex);
  tabIndexRef.current = tabIndex;

  useEffect(() => {
    actions.registerField(name, defaultValueRef.current as unknown, tabIndexRef.current);
    return () => {
      actions.unregisterField(name, { keepValue: keepValueOnUnmount });
    };
    // We intentionally exclude `actions` and `defaultValue` from deps to
    // avoid double-registering on identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, name, keepValueOnUnmount]);

  const onChange = useCallback(
    (next: T) => actions.changeField(name, next),
    [actions, name]
  );

  const onBlur = useCallback(() => actions.blurField(name), [actions, name]);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      const runtime = getFormRuntime(formId);
      if (runtime) runtime.registerRef(name, el);
    },
    [formId, name]
  );

  return {
    field: { name, value, onChange, onBlur, ref },
    fieldState: {
      error,
      invalid: !!error,
      isTouched: meta.isTouched,
      isDirty: meta.isDirty,
      isValidating: meta.isValidating,
    },
    meta,
  };
}
