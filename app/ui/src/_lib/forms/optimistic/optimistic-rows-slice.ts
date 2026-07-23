/**
 * optimistic-rows-slice — Redux store of in-flight Create rows, indexed by
 * `<serviceTypeName>.<methodName>` (the same key shape Connect-Query uses for
 * a list query).
 *
 * Why a Redux slice instead of `queryClient.setQueryData`?
 * setQueryData on TanStack Query's cache for a Connect-Query list response
 * (a proto Message instance) does not reliably trigger React re-renders for
 * the grid: deep-equal structural sharing with Message instances confused
 * the observer in our setup, so the new items array reached `useQuery.data`
 * but never propagated through PureGrid's `React.memo(isEqual)` to the DOM.
 * A separate Redux slice with `useSelector` guarantees the grid component
 * re-renders the moment the optimistic row is added.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OptimisticRow {
  id: string;
  /** Plain object representation of the form proto, plus any defaults. */
  data: Record<string, unknown>;
}

export interface OptimisticRowsState {
  /** key = `<serviceTypeName>.<methodName>`, value = pending insert rows. */
  byList: Record<string, OptimisticRow[]>;
}

const initialState: OptimisticRowsState = {
  byList: {},
};

export const optimisticRowsSlice = createSlice({
  name: 'optimisticRows',
  initialState,
  reducers: {
    optimisticRowAdded(
      state,
      action: PayloadAction<{ listKey: string; row: OptimisticRow }>,
    ) {
      const { listKey, row } = action.payload;
      if (!state.byList[listKey]) state.byList[listKey] = [];
      state.byList[listKey].push(row);
    },
    optimisticRowRemoved(
      state,
      action: PayloadAction<{ listKey: string; id: string }>,
    ) {
      const { listKey, id } = action.payload;
      const list = state.byList[listKey];
      if (!list) return;
      state.byList[listKey] = list.filter((r) => r.id !== id);
    },
  },
});

export const optimisticRowsActions = optimisticRowsSlice.actions;
export const OptimisticRowsReducer = optimisticRowsSlice.reducer;

/** Compose a list-key from a Connect-Query method descriptor. */
export function makeListKey(serviceTypeName: string, methodName: string): string {
  return `${serviceTypeName}.${methodName}`;
}
