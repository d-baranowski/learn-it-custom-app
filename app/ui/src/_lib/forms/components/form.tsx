/**
 * <Form> — top-level form component for the new Redux-backed forms framework.
 *
 * Lifecycle (per design doc §7):
 *
 *   1. mount: dispatch `formCreated`, create+register a FormRuntime with the
 *      WASM resolver and submit handler, set up the FormContext.
 *   2. if `entityId` provided: useQuery the entity; on data → dispatch
 *      `formLoaded` (replaces values + defaults, clears dirty/errors).
 *   3. user interacts → field components dispatch fieldChanged/fieldBlurred
 *      (handled by Phase 1 framework).
 *   4. submit → dispatch `formSubmitStarted`. The validation listener
 *      middleware (Phase 1.6) runs validateAll, then invokes the runtime's
 *      submitHandler (which builds proto + calls the mutation).
 *   5. unmount: dispatch `formDestroyed` with persistOnDismiss; if dirty,
 *      becomes a draft.
 *
 * Window↔form binding: if `windowId` is provided, the form binds itself
 * (so the window manager can detect dirty-on-close).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Fade, Grid, LinearProgress } from '@mui/material';
import { Message, toPlainMessage } from '@bufbuild/protobuf';
import { createConnectQueryKey, MethodUnaryDescriptor, useMutation, useQuery } from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'next-i18next';
import { useTranslation } from 'next-i18next';
import { toast } from 'react-hot-toast';
import type { Permission } from '@gen/permissions';

import type { AppDispatch } from '~/_lib/grid/state/store';
import { GetMessage } from '~/types/form';
import { useUserPermissions } from '~/providers/user-permissions';

import {
  formsActions,
} from '../state/forms-slice';
import { useFormActions, useFormFlags } from '../state/hooks';
import { FormContextProvider } from '../runtime/form-context';
import {
  createFormRuntime,
  noopResolver,
  FormRuntime,
  FormSubmitHandler,
  FormResolver,
} from '../runtime/create-form-runtime';
import {
  registerFormRuntime,
  unregisterFormRuntime,
} from '../runtime/form-runtime-registry';
import { createWasmResolver } from '../resolvers/wasm-resolver';
import {
  buildProtoFromValues,
  extractValuesFromProto,
  ProtoConstructor,
} from '../proto/proto-bridge';
import { makeFormId } from './form-id';
import {
  applyOptimisticListPatch,
  cancelMatchingListQueries,
  makeOptimisticTempId,
  mergeRowWithFormProto,
} from '../optimistic/optimistic-list';
import {
  optimisticRowsActions,
  makeListKey,
} from '../optimistic/optimistic-rows-slice';
import type { GenericListResponse } from '~/_lib/grid/types/list-response';

/**
 * Configures optimistic patching of a list/grid query when this form saves.
 *
 * On submit, every TanStack-Query cache page matching the descriptor's
 * service+method is snapshotted, patched in-place (Update replaces the row by
 * id; Create prepends a temp row), and the mutation is awaited. On success
 * the patches are replaced with the real server response; on error the
 * snapshots are restored and the error path proceeds as today.
 *
 * Calendars and other non-TanStack consumers (e.g. RpgCalendar's useAsync
 * state) do their own optimistic updates via `calendarRef.optimisticUpdate`
 * — they should NOT pass this prop.
 */
export interface OptimisticListConfig<O extends Message<O>> {
  listDescriptor: MethodUnaryDescriptor<any, GenericListResponse<O>>;
  /**
   * Build the optimistic row for an Update from the existing cached row, the
   * (yet-to-be-saved) form proto, and raw form values. Defaults to a shallow
   * merge of the existing row with the form proto so server-only fields
   * (timestamps, joined relations) survive the optimistic patch.
   */
  applyUpdate?: (existingRow: O, formProto: any, formValues: Record<string, unknown>) => O;
}

export interface FormIo<I extends Message<I>, O extends Message<O>> {
  /**
   * Required for edit forms (entityId !== null) and singletons. Loads the
   * existing entity.
   *
   * The input type is loose because the project has two get-request shapes
   * (GetMessage and request.v1.GetRequest) that are structurally compatible
   * but nominally distinct. Both have an `ID: string` field which is what
   * the form passes (the empty `{}` shape is used for singletons).
   */
  get?: MethodUnaryDescriptor<any, O>;
  /** Required unless `singleton` is true. */
  create?: MethodUnaryDescriptor<I, O>;
  /** If absent, `create` is reused for updates (non-singleton). */
  update?: MethodUnaryDescriptor<I, O>;
}

export interface FormProps<I extends Message<I>, O extends Message<O>> {
  /**
   * Optional explicit formId. If absent, computed from entityType+entityId.
   * Pass an explicit id only when you have a reason to override the convention.
   */
  formId?: string;

  /** Entity grouping — drives draft index, formId convention, conflict detection. */
  entityType: string;

  /**
   * null = create form; else edit form for that entity.
   * Ignored when `singleton` is true.
   */
  entityId: string | null;

  /**
   * Singleton mode for entities like SystemSettings: there is exactly one
   * row and `io.get` takes `{}` rather than `{ID: ...}`. Submits always
   * use `io.update` (no create). `entityId` is ignored — formId becomes
   * `<entityType>:singleton`.
   */
  singleton?: boolean;

  /**
   * Proto class used for validation and as the input shape of the
   * submit mutation. For typical CRUD forms this is the *request* proto
   * (e.g. SaveTherapyRequest), not the entity proto (Therapy) — though the
   * two often have overlapping field shapes. Matches the legacy
   * BaseForm convention of using `update.I` / `create.I` here.
   */
  protoConstructor: ProtoConstructor<I>;

  /** Schema version for draft compatibility. Bump when fields change shape. */
  schemaVersion?: number;

  /** Defaults layered on top of the proto's zero value. */
  defaultValues?: Record<string, unknown>;

  /** Endpoints for load + submit. */
  io: FormIo<I, O>;

  /**
   * If supplied, the form patches the matching grid's TanStack-Query cache
   * optimistically on submit and rolls back on error. Most CRUD forms should
   * pass this; ad-hoc forms with no associated grid (singletons, password
   * reset) and forms whose containing view manages its own state (calendars)
   * leave it absent.
   */
  optimisticList?: OptimisticListConfig<O>;

  /** Synchronous custom validation rules. */
  customValidation?: (values: Record<string, unknown>) => Record<string, string>;

  /** Window this form lives in (for binding + close-while-dirty handling). */
  windowId?: string;

  /** Default true. Set false for ephemeral forms (e.g., one-off password reset). */
  persistOnDismiss?: boolean;

  /**
   * If false, the form mounts but does not subscribe to its own life cycle —
   * useful for testing. Default true.
   */
  active?: boolean;

  /** Called on successful submit with the saved entity. */
  onSubmitSuccess?: (saved: O) => void;

  /** Called on submit failure. */
  onSubmitError?: (err: Error) => void;

  /** Legacy compat with rpg-window-manager which passes these. */
  afterSave?: (saved: O) => void;
  onCancel?: () => void;

  /**
   * Permission subject that gates submission. When set, the SaveButton is
   * disabled unless the active user has the relevant ability:
   *   - new entity (entityId === null && !singleton): `Create`
   *   - existing entity / singleton: `Update`
   * Forms without a permission default to "anyone may submit", matching
   * the legacy BaseForm behaviour (which logs a warning and allows submit).
   */
  permission?: Permission;

  /**
   * Optional minimum height for the form container — useful for tabbed
   * forms whose tab bodies vary in height, so the dialog doesn't snap
   * smaller when the user switches to a shorter tab.
   */
  minHeight?: number | string;

  /**
   * When provided, replaces the default backend create/update call.
   * The handler receives all form values and returns the "saved" entity.
   * Useful for local-only editing (e.g. session override previews).
   */
  customSubmitHandler?: (values: Record<string, unknown>, isUpdate: boolean) => Promise<O>;

  /** Children read formId from context via useFormId(). */
  children: React.ReactNode;

  /**
   * Render-prop alternative. If provided, called with form flags so callers
   * can render conditionally (e.g., disable Save while invalid).
   */
  actions?: (args: {
    formId: string;
    isDirty: boolean;
    isSubmitting: boolean;
    onCancel?: () => void;
  }) => React.ReactNode;
}

const FormLoadingFallback: React.FC = () => (
  <Box display="flex" justifyContent="center" padding={4}>
    <CircularProgress />
  </Box>
);

export function Form<I extends Message<I>, O extends Message<O>>(
  props: FormProps<I, O>
): React.ReactElement | null {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation('common');

  const formId = useMemo(
    () =>
      props.formId ??
      (props.singleton
        ? `${props.entityType}:singleton`
        : makeFormId({ entityType: props.entityType, entityId: props.entityId })),
    [props.formId, props.entityType, props.entityId, props.singleton]
  );

  const persistOnDismiss = props.persistOnDismiss ?? true;
  const schemaVersion = props.schemaVersion ?? 1;
  const active = props.active ?? true;

  // ─── Mutations and entity load ────────────────────────────────────────────
  if (!props.singleton && !props.io.create) {
    throw new Error(
      `<Form entityType="${props.entityType}">: io.create is required ` +
        `unless singleton is true.`
    );
  }
  // useMutation needs a descriptor — for singletons (no create), we use
  // io.update as the placeholder; the createFn handle is never invoked there.
  const createDescriptor = props.io.create ?? props.io.update!;
  const updateDescriptor = props.io.update ?? props.io.create!;
  const { mutateAsync: createFn } = useMutation(createDescriptor);
  const { mutateAsync: updateFn } = useMutation(updateDescriptor);
  const queryClient = useQueryClient();

  const getDescriptor = props.io.get;
  const queryEnabled =
    active &&
    !!getDescriptor &&
    (props.singleton || props.entityId !== null);
  const queryArgs = props.singleton
    ? ({} as GetMessage)
    : props.entityId !== null
      ? { ID: props.entityId }
      : undefined;

  const {
    data: loadedEntity,
    isLoading: isLoadingEntity,
    isFetching: isFetchingEntity,
    error: loadError,
    refetch: refetchEntity,
  } = useQuery(
    // useQuery requires a method descriptor even when disabled — pass a sentinel
    // and rely on `enabled: false`.
    getDescriptor ??
      (createDescriptor as unknown as MethodUnaryDescriptor<GetMessage, O>),
    queryArgs ?? ({ ID: '' } as GetMessage),
    { enabled: queryEnabled }
  );

  const canRefresh = queryEnabled;
  const refresh = React.useCallback(async () => {
    if (!canRefresh) return;
    await refetchEntity();
  }, [canRefresh, refetchEntity]);

  // ─── Resolver + runtime (stable across renders) ───────────────────────────
  const resolverRef = useRef<FormResolver>(noopResolver);
  resolverRef.current = useMemo<FormResolver>(
    () =>
      createWasmResolver<I>({
        protoConstructor: props.protoConstructor,
        t,
        customValidation: props.customValidation,
      }),
    [props.protoConstructor, t, props.customValidation]
  );

  // Latest submit handler held in a ref so the runtime always calls the
  // current closure (createFn/updateFn/entityId can change without
  // re-registering the runtime).
  const submitHandlerRef = useRef<FormSubmitHandler>(async () => {
    throw new Error('submit handler not yet initialised');
  });
  submitHandlerRef.current = async (values) => {
    if (props.customSubmitHandler) {
      const isUpdate = props.singleton || (props.entityId !== null && !!props.io.update);
      const saved = await props.customSubmitHandler(values, isUpdate);
      props.onSubmitSuccess?.(saved);
      props.afterSave?.(saved);
      return saved;
    }
    const proto = buildProtoFromValues(props.protoConstructor, values);
    const plain = toPlainMessage(proto as I) as unknown as I;
    // Use the update mutation only when the entity already exists *and* an
    // explicit update descriptor was provided. Forms whose io.update is
    // absent reuse the create mutation regardless (matches old BaseForm).
    // Singletons always update.
    const isUpdate = props.singleton || (props.entityId !== null && !!props.io.update);
    const fn = isUpdate ? updateFn : createFn;

    // Optimistic list integration — different mechanics for Update vs Create.
    //
    // Update: patch the matching row IN the TanStack-Query list cache via
    // `mergeRowWithFormProto` (form proto wins per defined key, preserving
    // computed columns like `therapistLabel`). Snapshot for rollback.
    //
    // Create: dispatch into a dedicated Redux slice (`optimisticRows`) that
    // GridPage reads via `useSelector` and prepends to its rendered rows.
    // We deliberately do NOT touch the queryClient list cache for Create —
    // it does not reliably propagate setQueryData updates of proto Message
    // payloads to PureGrid through the deep-equal `React.memo`, so the row
    // would never reach the DOM. The slice path is observed by
    // `useSelector` and guarantees a re-render. Pure-grid renders these
    // rows with a loading indicator and blocks click / dblclick (see
    // `__optimisticPending` row styling in pure-grid).
    const optList = props.optimisticList;
    let rollback: (() => void) | null = null;
    let createdTempId: string | null = null;
    let createdListKey: string | null = null;

    if (optList) {
      try {
        if (isUpdate) {
          const id = (plain as unknown as { id?: string; ID?: string }).id
            ?? (plain as unknown as { id?: string; ID?: string }).ID;
          if (id) {
            const matches = queryClient.getQueriesData<GenericListResponse<O>>({
              predicate: (q) =>
                Array.isArray(q.queryKey) &&
                q.queryKey[0] === optList.listDescriptor.service.typeName &&
                q.queryKey[1] === optList.listDescriptor.name,
            });
            let existingRow: O | undefined;
            for (const [, data] of matches) {
              const found = (data?.items as O[] | undefined)?.find(
                (it) => (it as unknown as { id?: string }).id === id,
              );
              if (found) {
                existingRow = found;
                break;
              }
            }
            const projected = optList.applyUpdate
              ? optList.applyUpdate(existingRow ?? (plain as unknown as O), plain, values)
              : mergeRowWithFormProto<O>(existingRow, plain as unknown as object);
            rollback = applyOptimisticListPatch(queryClient, optList.listDescriptor, {
              kind: 'patch',
              matchId: id,
              nextRow: projected,
            });
          }
        } else {
          const tempId = makeOptimisticTempId();
          createdTempId = tempId;
          createdListKey = makeListKey(
            optList.listDescriptor.service.typeName,
            optList.listDescriptor.name,
          );
          const baseTemp = mergeRowWithFormProto<O>(undefined, plain as unknown as object);
          dispatch(
            optimisticRowsActions.optimisticRowAdded({
              listKey: createdListKey,
              row: {
                id: tempId,
                data: { ...(baseTemp as object), id: tempId },
              },
            }),
          );
          rollback = () => {
            if (createdListKey && tempId) {
              dispatch(
                optimisticRowsActions.optimisticRowRemoved({
                  listKey: createdListKey,
                  id: tempId,
                }),
              );
            }
          };
        }
      } catch (err) {
        console.error('optimistic list integration failed; proceeding without it', err);
        rollback = null;
        createdTempId = null;
        createdListKey = null;
      }
    }

    let saved: O;
    try {
      saved = (await fn(plain as never)) as O;
    } catch (err) {
      rollback?.();
      throw err;
    }

    if (optList && saved) {
      const savedId = (saved as unknown as { id?: string; ID?: string }).id
        ?? (saved as unknown as { id?: string; ID?: string }).ID;
      try {
        if (isUpdate && savedId) {
          // Merge `saved` over the row currently in cache — server fields
          // win where defined, but any cached column the server's Update
          // response leaves out (computed labels like therapistLabel,
          // server-only joins) survives until the rpg:window:saved
          // refetch lands a fully populated row.
          const matches = queryClient.getQueriesData<GenericListResponse<O>>({
            predicate: (q) =>
              Array.isArray(q.queryKey) &&
              q.queryKey[0] === optList.listDescriptor.service.typeName &&
              q.queryKey[1] === optList.listDescriptor.name,
          });
          let currentRow: O | undefined;
          for (const [, data] of matches) {
            const found = (data?.items as O[] | undefined)?.find(
              (it) => (it as unknown as { id?: string }).id === savedId,
            );
            if (found) {
              currentRow = found;
              break;
            }
          }
          const merged = mergeRowWithFormProto<O>(
            currentRow,
            saved as unknown as object,
          );
          applyOptimisticListPatch(queryClient, optList.listDescriptor, {
            kind: 'patch',
            matchId: savedId,
            nextRow: merged,
          });
        }
      } catch (err) {
        console.error('failed to clear optimistic state after save', err);
      }
    }
    // Tanstack-query has staleTime: 60s in _app.tsx, so re-opening the same
    // entity within a minute would otherwise serve a stale cached copy and
    // hide the just-saved fields (TC_E2E_03, etc.). Push the fresh response
    // into the cache for io.get(ID), and invalidate the entity's list/auto
    // queries so other consumers refetch.
    if (getDescriptor) {
      try {
        const savedId = (saved as unknown as { id?: string; ID?: string }).id
          ?? (saved as unknown as { id?: string; ID?: string }).ID;
        if (savedId) {
          const getKey = createConnectQueryKey(getDescriptor, {
            ID: savedId,
          } as never);
          // Invalidate rather than setQueryData: the mutation response from
          // some backends omits relations (customerIds on Therapy) that the
          // dedicated GET endpoint does include. Seeding a partial entity
          // into the cache leaves nested grids/forms with stale fields and
          // breaks revalidation on reopen. Invalidating forces a fresh
          // fetch but still avoids the stale-cache problem TC_E2E_03 hit.
          queryClient.invalidateQueries({ queryKey: getKey });
        }
      } catch (err) {
        console.error('failed to invalidate get-query cache after save', err);
      }
    }
    // Notify the caller. These run before the formSubmitSucceeded action
    // dispatched by the validation middleware so that any caller that wants
    // to imperatively close a window etc. can do it synchronously.
    try {
      props.onSubmitSuccess?.(saved);
      props.afterSave?.(saved);
    } catch (err) {
      // Caller error must not be swallowed silently, but it also shouldn't
      // be re-thrown into the middleware (which would mark submit as failed
      // even though the mutation succeeded). Log and continue.
      console.error('onSubmitSuccess/afterSave threw after save', err);
    }
    return saved;
  };

  const runtimeRef = useRef<FormRuntime | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = createFormRuntime({
      formId,
      resolver: resolverRef.current,
      submitHandler: (values) => submitHandlerRef.current(values),
    });
  } else {
    // Keep resolver fresh if it changes (e.g., t function changes locale).
    runtimeRef.current.setResolver(resolverRef.current);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!active) return;

    dispatch(
      formsActions.formCreated({
        formId,
        entityType: props.entityType,
        entityId: props.singleton ? null : props.entityId,
        protoTypeName: new props.protoConstructor().getType().typeName,
        schemaVersion,
        defaultValues: props.defaultValues ?? {},
        // Only mark willLoad if we'll actually load (entity edit or singleton).
        // Forms scoped to an entity but without a get (e.g., password reset)
        // start in 'ready' status.
        willLoad: queryEnabled,
      })
    );
    registerFormRuntime(formId, runtimeRef.current!);
    if (props.windowId) {
      dispatch(formsActions.windowBoundToForm({ windowId: props.windowId, formId }));
    }
    setIsReady(true);

    return () => {
      unregisterFormRuntime(formId);
      if (props.windowId) {
        dispatch(formsActions.windowUnboundFromForm({ windowId: props.windowId }));
      }
      dispatch(formsActions.formDestroyed({ formId, persistOnDismiss }));
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, active]);

  // Apply loaded entity → formLoaded.
  useEffect(() => {
    if (!isReady || !loadedEntity) return;
    const values = extractValuesFromProto(loadedEntity as Message<O>);
    dispatch(formsActions.formLoaded({ formId, values }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, loadedEntity, formId]);

  // Show load errors as a toast (Phase 2 placeholder; centralised error
  // middleware in Phase 2.8 will replace this).
  useEffect(() => {
    if (loadError) {
      const msg = loadError instanceof Error ? loadError.message : String(loadError);
      toast.error(msg);
      dispatch(formsActions.formLoadFailed({ formId, error: msg }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError, formId]);

  // ─── Permission gating ────────────────────────────────────────────────────
  // Mirrors legacy BaseForm: if a permission is supplied, gate Save on
  // canCreate (new entity) or canUpdate (existing/singleton). When absent,
  // we default open — the legacy form logged a warning and allowed submit.
  const { canCreate, canUpdate } = useUserPermissions();
  const isUpdate = props.singleton || props.entityId !== null;
  const canSubmit = useMemo(() => {
    if (!props.permission) return true;
    return isUpdate ? canUpdate(props.permission) : canCreate(props.permission);
    // canCreate/canUpdate identity changes whenever the permissions context
    // refreshes — depending on them is intentional.
  }, [props.permission, isUpdate, canCreate, canUpdate]);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!isReady) return <FormLoadingFallback />;
  if (queryEnabled && isLoadingEntity) return <FormLoadingFallback />;

  return (
    <FormContextProvider
      formId={formId}
      canSubmit={canSubmit}
      windowId={props.windowId}
      refresh={refresh}
      canRefresh={canRefresh}
      isRefreshing={isFetchingEntity && !isLoadingEntity}
    >
      <FormFlagsBridge
        formId={formId}
        onSubmitSuccess={(saved) => {
          props.onSubmitSuccess?.(saved as O);
          props.afterSave?.(saved as O);
        }}
        onSubmitError={props.onSubmitError}
      />
      <FormElement formId={formId} entityType={props.entityType}>
        <Grid container spacing={1} sx={{ minHeight: props.minHeight ?? 'auto' }}>
          {props.children}
          {props.actions ? (
            <FormActionsRenderProp
              formId={formId}
              render={props.actions}
              onCancel={props.onCancel}
            />
          ) : null}
        </Grid>
      </FormElement>
    </FormContextProvider>
  );
}

/**
 * Renders the actual `<form>` HTML element so the browser/MUI tooling
 * (Enter-to-submit, type="submit" buttons, autocomplete, accessibility
 * tree) work the way users expect. Submit dispatches into Redux; the
 * validation middleware takes it from there.
 */
const FormElement: React.FC<{
  formId: string;
  entityType: string;
  children: React.ReactNode;
}> = ({ formId, entityType, children }) => {
  const actions = useFormActions(formId);
  return (
    <form
      noValidate
      data-testid="tabular-form-wrapper"
      // Lets tests scope queries to a specific form when multiple forms
      // are stacked (e.g., a session form opened from a therapy form's
      // Sessions tab). Cypress: `cy.get('[data-form-entity="session"] ...')`.
      data-form-entity={entityType}
      onSubmit={(e) => {
        e.preventDefault();
        actions.submit();
      }}
    >
      {children}
    </form>
  );
};

/**
 * Internal — bridges Redux submit lifecycle to caller callbacks.
 * Renders nothing.
 */
const FormFlagsBridge: React.FC<{
  formId: string;
  onSubmitSuccess?: (saved: unknown) => void;
  onSubmitError?: (err: Error) => void;
}> = ({ formId, onSubmitSuccess, onSubmitError }) => {
  const flags = useFormFlags(formId);

  // Watch submitCount transitions to detect success/error edges.
  const lastSeenRef = useRef({ submitCount: 0, isSubmitting: false });
  useEffect(() => {
    const prev = lastSeenRef.current;
    if (prev.isSubmitting && !flags.isSubmitting) {
      // Just finished — caller-side handlers fire from listener middleware
      // events rather than here, so this hook is currently a no-op stub.
      // Wired up properly when centralised error middleware lands (2.8).
    }
    lastSeenRef.current = { submitCount: flags.submitCount, isSubmitting: flags.isSubmitting };
  }, [flags.submitCount, flags.isSubmitting, onSubmitSuccess, onSubmitError]);
  return null;
};

const FormActionsRenderProp: React.FC<{
  formId: string;
  render: NonNullable<FormProps<Message<any>, Message<any>>['actions']>;
  onCancel?: () => void;
}> = ({ formId, render, onCancel }) => {
  const flags = useFormFlags(formId);
  return <>{render({
    formId,
    isDirty: flags.isDirty,
    isSubmitting: flags.isSubmitting,
    onCancel,
  })}</>;
};
