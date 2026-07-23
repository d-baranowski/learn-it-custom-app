import rison from 'rison';
import {getInitialGridState, GridReduxState} from '~/_lib/grid/state/grids-slice';


export interface DecodeResult {
  columnOrder: GridReduxState["columnOrder"];
  columnVisibility: GridReduxState["columnVisibility"];
  rowSelection: GridReduxState["rowSelection"];
  filters: GridReduxState["filters"];
  sorting: GridReduxState["sorting"];
  pagination: GridReduxState["pagination"];
  deletedState: GridReduxState["deletedState"];
}

export const decode = (token: string): DecodeResult => {
  const decoded = rison.decode_object(token) as any;

  return {
    columnOrder: decoded.columnOrder,
    columnVisibility: decoded.columnVisibility,
    rowSelection: decoded.rowSelection,
    filters: decoded.filters,
    sorting: decoded.sorting,
    pagination: decoded.pagination,
    deletedState: decoded.deletedState,
  }
}

/**
 * rison can't encode `undefined` — anywhere in the tree, including inside
 * nested objects and arrays. Recursively strip `undefined` values before
 * handing the payload to rison.
 */
function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((v) => v !== undefined);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>)) {
      const v = stripUndefined((value as Record<string, unknown>)[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return value;
}

export const encode = (state: DecodeResult): string => {
  const defaultState = getInitialGridState();
  // Use `??` so an enum-zero (DeletedState.DS_NOT_DELETED) doesn't fall back
  // to its own default unnecessarily.
  const merged = {
    columnOrder: state.columnOrder ?? defaultState.columnOrder,
    columnVisibility: state.columnVisibility ?? defaultState.columnVisibility,
    rowSelection: state.rowSelection ?? defaultState.rowSelection,
    deletedState: state.deletedState ?? defaultState.deletedState,
    filters: state.filters ?? defaultState.filters,
    sorting: state.sorting ?? defaultState.sorting,
    pagination: state.pagination ?? defaultState.pagination,
  };
  return rison.encode_object(stripUndefined(merged) as Record<string, unknown>);
};
