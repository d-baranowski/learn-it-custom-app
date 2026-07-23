/**
 * optimistic-list — apply, snapshot, and roll back optimistic patches against
 * every TanStack Query cache entry that matches a Connect-RPC LIST descriptor.
 *
 * Used by <Form> when an `optimisticList` prop is supplied. Lives outside
 * form.tsx so the cache-walking logic is unit-testable in isolation.
 *
 * Connect-Query keys are `[serviceTypeName, methodName, input]`. We match on
 * the first two elements so a single mutation patches every paginated /
 * filtered cache page for that list query.
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { Message } from '@bufbuild/protobuf';
import type { MethodUnaryDescriptor } from '@connectrpc/connect-query';
import type { GenericListResponse } from '~/_lib/grid/types/list-response';

/**
 * Marker placed on optimistically-inserted Create rows. Pure-grid renders
 * such rows with a reduced opacity + spinner overlay and ignores click /
 * dblclick so the user can't open a form for an entity that doesn't exist
 * server-side yet. Tests can assert the marker is briefly visible via
 * `data-optimistic-pending="true"`.
 */
export const OPTIMISTIC_PENDING_FIELD = '__optimisticPending';
export const OPTIMISTIC_ID_PREFIX = 'optimistic_';

export type ListOp<O> =
  | { kind: 'patch'; matchId: string; nextRow: O }
  | { kind: 'insert'; row: O }
  | { kind: 'remove'; matchId: string };

type Snapshot<O extends Message<O>> = [QueryKey, GenericListResponse<O> | undefined];

function matchesListDescriptor(
  queryKey: QueryKey,
  serviceName: string,
  methodName: string,
): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === serviceName &&
    queryKey[1] === methodName
  );
}

export async function cancelMatchingListQueries<I extends Message<I>, O extends Message<O>>(
  queryClient: QueryClient,
  listDescriptor: MethodUnaryDescriptor<I, GenericListResponse<O>>,
): Promise<void> {
  const serviceName = listDescriptor.service.typeName;
  const methodName = listDescriptor.name;
  await queryClient.cancelQueries({
    predicate: (q) => matchesListDescriptor(q.queryKey, serviceName, methodName),
  });
}

/**
 * Applies `op` to every cached page of `listDescriptor`, returning a rollback
 * closure that restores all touched caches to their pre-patch state.
 *
 * Returns `null` if no matching cache pages exist (nothing to patch, nothing
 * to roll back) — caller need not invoke the noop.
 */
export function applyOptimisticListPatch<I extends Message<I>, O extends Message<O>>(
  queryClient: QueryClient,
  listDescriptor: MethodUnaryDescriptor<I, GenericListResponse<O>>,
  op: ListOp<O>,
): (() => void) | null {
  const serviceName = listDescriptor.service.typeName;
  const methodName = listDescriptor.name;

  const matches = queryClient.getQueriesData<GenericListResponse<O>>({
    predicate: (q) => matchesListDescriptor(q.queryKey, serviceName, methodName),
  });

  if (matches.length === 0) return null;

  const snapshots: Snapshot<O>[] = matches.map(([key, data]) => [key, data]);

  for (const [key, data] of matches) {
    if (!data) continue;
    const items: O[] = (data.items ?? []) as O[];
    let nextItems: O[];

    switch (op.kind) {
      case 'patch': {
        let didReplace = false;
        nextItems = items.map((it) => {
          if (rowId(it) === op.matchId) {
            didReplace = true;
            return op.nextRow;
          }
          return it;
        });
        if (!didReplace) continue;
        break;
      }
      case 'insert': {
        nextItems = [op.row, ...items];
        break;
      }
      case 'remove': {
        const before = items.length;
        nextItems = items.filter((it) => rowId(it) !== op.matchId);
        if (nextItems.length === before) continue;
        break;
      }
    }

    queryClient.setQueryData(key, { ...data, items: nextItems });
  }

  return () => {
    for (const [key, snapshot] of snapshots) {
      queryClient.setQueryData(key, snapshot);
    }
  };
}

function rowId(row: unknown): string | undefined {
  if (row && typeof row === 'object') {
    const r = row as { id?: string; ID?: string };
    return r.id ?? r.ID;
  }
  return undefined;
}

export function makeOptimisticTempId(): string {
  return `${OPTIMISTIC_ID_PREFIX}${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

/**
 * Merge a form proto / saved-entity over an existing cached row so the visible
 * row reflects new fields without wiping computed/joined columns the source
 * doesn't carry (e.g., `therapistLabel`). The source wins only when its key
 * carries a meaningful value — `undefined`, `null`, `""`, and empty arrays
 * are treated as "not provided" so the cached value survives.
 *
 * Empty string is intentionally treated as not-provided. proto-bridge
 * normalises form-input `""`/`null` to `undefined` before the proto is
 * built, so genuine user "clears" go through as undefined; an `""` value
 * here therefore comes from a proto default the source doesn't actually
 * populate (typical when a server Update response omits computed labels).
 *
 * For Create there is no existing row; we still drop undefined/null so the
 * temp row carries only the keys the user actually set.
 */
export function mergeRowWithFormProto<O extends object>(
  existingRow: O | undefined,
  formProto: object,
): O {
  const base: Record<string, unknown> = existingRow
    ? { ...(existingRow as object) }
    : {};
  for (const key in formProto) {
    const v = (formProto as Record<string, unknown>)[key];
    if (isMeaningful(v)) {
      base[key] = v;
    }
  }
  return base as O;
}

function isMeaningful(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (v === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

