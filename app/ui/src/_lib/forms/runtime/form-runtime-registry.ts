/**
 * form-runtime-registry — module-level singleton holding the per-form
 * non-Redux state (DOM refs, resolver instance, focus utilities).
 *
 * Why a singleton (not React context):
 *   - The validation listener middleware needs access to a form's resolver
 *     when an action is dispatched. Middleware can't read React state /
 *     context. A module-level Map gives it a synchronous lookup.
 *   - Components also use this registry via `useFormRuntime(formId)` so
 *     they read the *same* runtime the middleware sees.
 *
 * Lifecycle:
 *   - A Form component calls `registerFormRuntime(formId, runtime)` on mount.
 *   - On unmount it calls `unregisterFormRuntime(formId)`.
 *   - Registration is per `formId`, not per render — re-renders reuse the
 *     existing entry.
 */

import type { FormRuntime } from './create-form-runtime';

const registry = new Map<string, FormRuntime>();

export function registerFormRuntime(formId: string, runtime: FormRuntime): void {
  registry.set(formId, runtime);
}

export function unregisterFormRuntime(formId: string): void {
  registry.delete(formId);
}

export function getFormRuntime(formId: string): FormRuntime | undefined {
  return registry.get(formId);
}

/**
 * Test-only — clear the entire registry. Do not call from app code.
 */
export function _resetFormRuntimeRegistryForTests(): void {
  registry.clear();
}
