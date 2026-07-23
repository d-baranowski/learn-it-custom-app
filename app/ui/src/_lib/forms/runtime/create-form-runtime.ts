/**
 * createFormRuntime — per-form, non-Redux state.
 *
 * Holds:
 *   - DOM ref map keyed by field name (for focusing the first error, etc.)
 *   - Resolver instance (validation strategy)
 *
 * Created once per mounted form (by the <Form> component during Phase 2).
 * Registered into form-runtime-registry so middleware can find it.
 */

import type { FieldError } from '../state/forms-slice';

/**
 * A FormResolver returns errors for a single field or for the whole form.
 * Implementations may be sync or async; the dispatcher always awaits them.
 */
export interface FormResolver {
  /** Validate a single field; null if valid. */
  validateField(
    name: string,
    value: unknown,
    allValues: Record<string, unknown>
  ): Promise<FieldError | null>;

  /**
   * Validate the entire form. Returns a name → error map for invalid fields.
   * May also include `_form` key for form-level errors (path: '_form').
   */
  validateAll(
    values: Record<string, unknown>
  ): Promise<Record<string, FieldError>>;
}

/**
 * Caller-supplied submit handler. Receives the latest form values and is
 * expected to perform the mutation (e.g., ConnectRPC create/update).
 * Returns the saved entity (or undefined). Throws on failure.
 */
export type FormSubmitHandler = (values: Record<string, unknown>) => Promise<unknown>;

export interface FormRuntime {
  formId: string;

  /** Register or clear a DOM ref for a field. */
  registerRef(name: string, el: HTMLElement | null): void;

  /** Get the current DOM ref for a field, or null. */
  getRef(name: string): HTMLElement | null;

  /** Focus the first registered field that has an error. */
  focusFirstError(errorNames: string[]): void;

  /** The validation strategy for this form. */
  resolver: FormResolver;

  /** Replace the resolver in-place (rare; primarily for tests). */
  setResolver(resolver: FormResolver): void;

  /** Submit handler, set by the Form component. Called by the validation
   * middleware after a clean submit validation. */
  submitHandler: FormSubmitHandler | null;

  setSubmitHandler(handler: FormSubmitHandler | null): void;
}

export interface CreateFormRuntimeOpts {
  formId: string;
  resolver: FormResolver;
  submitHandler?: FormSubmitHandler;
}

export function createFormRuntime(opts: CreateFormRuntimeOpts): FormRuntime {
  const refs = new Map<string, HTMLElement>();
  let resolver = opts.resolver;
  let submitHandler: FormSubmitHandler | null = opts.submitHandler ?? null;

  const registerRef = (name: string, el: HTMLElement | null): void => {
    if (el === null) {
      refs.delete(name);
    } else {
      refs.set(name, el);
    }
  };

  const getRef = (name: string): HTMLElement | null => {
    return refs.get(name) ?? null;
  };

  const focusFirstError = (errorNames: string[]): void => {
    for (const name of errorNames) {
      const el = refs.get(name);
      if (el && typeof el.focus === 'function') {
        el.focus();
        return;
      }
    }
  };

  return {
    formId: opts.formId,
    registerRef,
    getRef,
    focusFirstError,
    get resolver() {
      return resolver;
    },
    setResolver(next) {
      resolver = next;
    },
    get submitHandler() {
      return submitHandler;
    },
    setSubmitHandler(next) {
      submitHandler = next;
    },
  };
}

/**
 * No-op resolver — used as a default when a form is created before its
 * real resolver is wired up (e.g., during initial mount before useEffect).
 * Always returns clean.
 */
export const noopResolver: FormResolver = {
  async validateField() {
    return null;
  },
  async validateAll() {
    return {};
  },
};
