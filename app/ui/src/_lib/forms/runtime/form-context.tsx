/**
 * FormContext — provides the active form's id (and a few sibling values
 * that every descendant needs) to children so field components don't have
 * to thread them as props.
 *
 * The <Form> component wraps its children with this provider. Field
 * components read formId via `useFormId()`. SaveButton reads `canSubmit`
 * via `useFormCanSubmit()` to gate on permission.
 */

import React from 'react';

interface FormContextValue {
  formId: string;
  canSubmit: boolean;
  windowId?: string;
  refresh?: () => Promise<void> | void;
  canRefresh?: boolean;
  isRefreshing?: boolean;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export const FormContextProvider: React.FC<{
  formId: string;
  canSubmit?: boolean;
  windowId?: string;
  refresh?: () => Promise<void> | void;
  canRefresh?: boolean;
  isRefreshing?: boolean;
  children: React.ReactNode;
}> = ({ formId, canSubmit = true, windowId, refresh, canRefresh = false, isRefreshing = false, children }) => {
  const value = React.useMemo<FormContextValue>(
    () => ({ formId, canSubmit, windowId, refresh, canRefresh, isRefreshing }),
    [formId, canSubmit, windowId, refresh, canRefresh, isRefreshing]
  );
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

/**
 * Get the current form's id from context. Throws if not inside a <Form>.
 */
export function useFormId(): string {
  const ctx = React.useContext(FormContext);
  if (ctx === null) {
    throw new Error(
      'useFormId() called outside a <Form>. Wrap with <FormContextProvider> or pass formId explicitly.'
    );
  }
  return ctx.formId;
}

/**
 * Same as useFormId() but returns null instead of throwing — useful for
 * components that work both inside and outside a form context.
 */
export function useOptionalFormId(): string | null {
  return React.useContext(FormContext)?.formId ?? null;
}

/**
 * Whether the surrounding <Form> permits submission for the current user.
 * Returns true when called outside a form (so unrelated buttons aren't
 * gated accidentally).
 */
export function useFormCanSubmit(): boolean {
  return React.useContext(FormContext)?.canSubmit ?? true;
}

export function useOptionalFormWindowId(): string | null {
  return React.useContext(FormContext)?.windowId ?? null;
}

export function useOptionalFormRefresh(): {
  refresh?: () => Promise<void> | void;
  canRefresh: boolean;
  isRefreshing: boolean;
} {
  const ctx = React.useContext(FormContext);
  return {
    refresh: ctx?.refresh,
    canRefresh: ctx?.canRefresh ?? false,
    isRefreshing: ctx?.isRefreshing ?? false,
  };
}
