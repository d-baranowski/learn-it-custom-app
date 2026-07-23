# `_lib/forms` — Redux-backed form state

UTR-000140. All 22 application forms are migrated. The framework lives here; the **field components** (`StringFe`, `NumberFe`, …) live in [`~/components/form/elements/`](../../components/form/elements/) so the day-to-day pattern matches the legacy folder layout.

See `_plans/utr-000140-rhf-redux-design.md` for the full design.

## Where things live

**Framework (this folder, `_lib/forms/`):**

```
state/
  forms-slice.ts                FormsState shape + reducers (single source of truth)
  hooks.ts                      useFieldValue, useFieldError, useFieldMeta,
                                useFormFlags, useFormActions, useFormActiveTabIndex
  validation-middleware.ts      RTK listener: blur → validate field,
                                submit → validate all → invoke submit handler
  error-toast-middleware.ts     RTK listener: surfaces formError /
                                formSubmitFailed / formLoadFailed as toasts
  forms-draft-storage.ts        localStorage persistence for drafts
                                (24h TTL, 50-entry LRU, schemaVersion-gated)

runtime/
  form-runtime-registry.ts      Module-level Map<formId, FormRuntime>
  create-form-runtime.ts        Per-form non-Redux state: refs, resolver, submit handler
  form-context.tsx              FormContext + useFormId()
  use-form-controller.ts        Replacement for RHF useController

components/
  form.tsx                      <Form> — top-level Redux-backed form
  form-tabs.tsx                 <FormTabs>, <FormTab> — replaces TabularForm
  form-id.ts                    formId conventions: <type>:<id> / <type>:new:<nonce>

proto/
  proto-bridge.ts               buildProtoFromValues, extractValuesFromProto.
                                Field-array values (arrays of message objects)
                                live as a single Redux key — owned by a
                                field-array component (e.g. SessionFrequencyFe).

resolvers/
  wasm-resolver.ts              FormResolver backed by the WASM proto validator

hooks/
  use-dependent-field.ts        useDependentField — collapses watch+useQuery+setValue

use-open-form.ts                useOpenForm() — opens (or focuses) a form by formId
```

**Field components (`~/components/form/elements/`):**

`string-fe`, `password-fe`, `number-fe`, `enum-fe`, `switch-fe`, `date-fe`, `time-fe`, `date-time-fe`, `date-string-fe`, `time-string-fe`, `timezone-fe`, `permission-fe`, `color-fe`, `markdown-fe`, `image-fe`, `rpg-autocomplete-fe`, `entity-autocompletes` (TherapistFe / ServiceFe / CustomerFe / OfficeFe / RoomFe / TeamFe / UserFe / RoleFe / LanguageFe / NationalityFe / TherapyFe / TherapistServiceFe), `session-frequency-fe`, `recurring-cashflow-frequency-fe`, `save-button`, `cancel-button`, `payment-link-display`, `use-default-label`, `use-autocomplete-options` (non-form-bound autocomplete loader for filter-style views).

## Architectural principles

1. **Redux is the single source of truth.** Form values, errors, dirty/touched meta, draft index, and window↔form binding all live in `forms-slice`. There is no second store to sync from. (The vendored RHF + RHF-MUI are gone — every app form is on this framework.)
2. **Per-field selectors** (`useFieldValue(formId, name)`) limit re-renders to the typed field. Default `useSelector` strict equality is the bedrock; `shallowEqual` for aggregates.
3. **Non-serializable per-form state lives in the runtime registry**, not Redux. DOM refs, the resolver instance, and the submit handler are accessed by middleware via `getFormRuntime(formId)`.
4. **Drafts are first-class.** Dirty forms become drafts on dismiss; restored on next mount with the same `formId`. Persistence is its own localStorage key with TTL/LRU/version gating.
5. **Window↔form binding** lives in `formIdByWindowId`. The `<Form>` component dispatches `windowBoundToForm` on mount when given a `windowId`, and `windowUnboundFromForm` on unmount.
6. **The bug class is structurally fixed.** `openForm({ entityType, entityId, ... })` takes the entity identity as a typed top-level argument, not a free-form `formProps` field. The old `formPropsMapper` bug (where the row's `id` could be replaced by user-supplied props) cannot recur.

## Quick reference

### Open a form

```tsx
import { useOpenForm } from '~/_lib/forms/use-open-form';

const { openForm } = useOpenForm();

openForm({
  formName: 'TherapyForm',           // FormRegistry key
  entityType: 'therapy',
  entityId: 'abc123',                 // null for create
  title: 'Edit Therapy',
});
```

If a window for this `formId` is already open, it gets focused — no duplicate.

### Define a form

```tsx
import { Form } from '~/_lib/forms/components/form';
import { StringFe } from '~/components/form/elements/string-fe';
import { Therapy } from '@gen/core/v1/therapy_pb';
import { create, get, update } from '@gen/core/v1/therapy-TherapyService_connectquery';

export const TherapyForm: React.FC<{ id?: string; windowId?: string }> = ({ id, windowId }) => (
  <Form
    entityType="therapy"
    entityId={id ?? null}
    protoConstructor={Therapy}
    schemaVersion={1}
    io={{ get, create, update }}
    windowId={windowId}
  >
    <StringFe name="displayName" label="Name" />
    <StringFe name="durationMin" label="Duration (min)" type="number" />
  </Form>
);
```

### Read a field value (e.g., for cross-field UI)

```tsx
import { useFieldValue, useFieldError } from '~/_lib/forms/state/hooks';
import { useFormId } from '~/_lib/forms/runtime/form-context';

function CharCount({ name }: { name: string }) {
  const formId = useFormId();
  const value = useFieldValue<string>(formId, name);
  return <span>{value?.length ?? 0} chars</span>;
}
```

### Cross-field auto-population (replaces watch + useQuery + setValue)

```tsx
import { useDependentField } from '~/_lib/forms/hooks/use-dependent-field';

useDependentField({
  watch: 'therapyId',
  query: getTherapy,
  apply: (therapy) => ({
    price: therapy.sessionPrice,
    therapistId: therapy.therapistId,
  }),
});
```

By default, the apply step won't overwrite a field the user has already touched.

### Submit

```tsx
const actions = useFormActions(formId);
actions.submit();
// Validation middleware runs validateAll → invokes runtime.submitHandler →
// dispatches formSubmitSucceeded / formSubmitFailed.
```

The error-toast listener surfaces failures automatically. Success path is handled by the `<Form>` component's `onSubmitSuccess` / `afterSave` props.

## Performance contract

The keystroke hot path is:

1. `<input>` `onChange` → `actions.changeField(name, value)` → dispatch.
2. Reducer mutates `state.forms.byId[formId].values[name]` via Immer.
3. Every `useSelector` subscriber re-runs its selector.
4. Per-field selectors return identical primitives for unchanged fields → strict equality skips the render.
5. Only the typed field's component commits.

**Things that would break this:**
- Reading `state.forms.byId[formId]` instead of `state.forms.byId[formId].values[name]` (returns a new object every keystroke).
- Updating a per-field timestamp on every keystroke (the meta object identity changes → re-render).
- Storing complex derived data in `values` that gets recomputed on every dispatch.

If profiling shows the budget is missed, the design doc §6.5 enumerates further levers (`weakMapMemoize`, `react-redux` `batch()`, IME composition coalescing). **Do not** introduce a parallel non-Redux store as an escape hatch — that violates Q1's locked decision.

## Out of scope (deferred follow-ups)

- **Draft-restored snackbar UX** — needs concrete UI motion design. Drafts are persisted today; just no UI to surface them yet. TODO marker in `store.ts`.
- **Confirm-dialog on close-while-dirty** — closing a window with a dirty form silently saves a draft today. The "save as draft? / discard?" prompt comes with the snackbar work.
- **Permission gating** — `canSubmit` from `useUserPermissions` will be wired into `<Form>` when a permission-gated workflow needs it.

## Tests

```bash
cd app/ui
node_modules/.bin/jest --testPathPattern='_lib/forms'
# 56 tests across 4 suites: forms-slice, forms-draft-storage,
# proto-bridge, form-id.
```

Hook + middleware tests with React Testing Library will land alongside the first migrated form (Phase 3.1, PasswordResetForm).
