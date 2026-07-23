import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {MRT_ColumnOrderState, MRT_Updater} from 'material-react-table';
import {Grid as GeneratedGrid} from '@gen/grids';
import {columnBuilder} from '~/_lib/grid/columns/column_builder';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {decode, encode} from '~/_lib/grid/encode';
import {GridName, GridViewStoreEntry} from '~/_lib/grid/view/types';
import {DeletedState, WhereOperator} from '@gen/request/v1/base_pb';
import {CellRendererName} from '../columns/cell_renderers';

// Define the state structure for a single grid
type GridReduxStateFilter = {
  id: string,
  value: any,
  operator: WhereOperator,
}

/**
 * MRT injects "display" columns (selection, actions, expand) at runtime via
 * pure-grid effects. Saved views and base orders only contain user columns,
 * so any time we replace `columnOrder` from such a source we must re-inject
 * the display columns that are currently live, otherwise MRT falls back to
 * appending them at the end (UTR-000159).
 */
function withLiveDisplayColumns(liveOrder: string[], replacementOrder: string[]): string[] {
  const userOrder = replacementOrder.filter(c => !c.startsWith('mrt-'));
  const displayCols = liveOrder.filter(c => c.startsWith('mrt-'));
  const front = displayCols.filter(c => c === 'mrt-row-select' || c === 'mrt-row-expand');
  const back = displayCols.filter(c => c === 'mrt-row-actions');
  return [...front, ...userOrder, ...back];
}

export interface GridReduxState {
  initialised: boolean;

  columns: ReduxStoreColumnDef[];

  columnOrder: string[];
  baseColumnOrder: string[];

  columnVisibility: Record<string, boolean>;
  baseColumnVisibility: Record<string, boolean>;

  quickFilters: string[];
  baseQuickFilters: string[];

  rowSelection: Record<string, boolean>;
  sorting: { desc: boolean; id: string }[]; // Updated sorting type

  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  totalItemCount: number | undefined;

  deletedState: DeletedState;
  filters: GridReduxStateFilter[];
  overrideFilters: GridReduxStateFilter[];
  columnManagerOpen: boolean;
}

// Define the structure for the slice state, which includes multiple grids keyed by name
export interface GridsState {
  views: Record<GridName, GridViewStoreEntry[]>;
  byName: Record<GridName, GridReduxState>;
}

// Initial state will have no grids
const initialState: GridsState = {
  views: {},
  byName: {},
};

// Helper function to initialize a new grid state
export const getInitialGridState = (): GridReduxState => ({
  initialised: false,

  columns: [],

  columnOrder: [],
  baseColumnOrder: [],

  columnVisibility: {},
  baseColumnVisibility: {},

  quickFilters: [],
  baseQuickFilters: [],

  rowSelection: {},
  sorting: [], // Typed as { desc: boolean, id: string }[]
  pagination: {pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE},
  totalItemCount: undefined,
  deletedState: DeletedState.DS_NOT_DELETED,
  filters: [],
  overrideFilters: [],
  columnManagerOpen: false,
});

// Create the grids slice
const gridsSlice = createSlice({
  name: 'grids',
  initialState,
  reducers: {
    columnAdd(state, action: PayloadAction<{
      name: string;
      column: string;
      visible: boolean;
      position: string | null | undefined
      enableSorting?: boolean;
      columnRenderType?: CellRendererName;
    }>) {
      const {name, column, visible, position, enableSorting, columnRenderType} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        if (!grid.columnOrder.includes(column)) {
          if (position === 'last') {
            grid.columnOrder.push(column);
          } else if (position === 'first') {
            grid.columnOrder.unshift(column);
          } else {
            const index = position ? grid.columnOrder.indexOf(position) : -1;
            if (index === -1) {
              grid.columnOrder.push(column);
            } else {
              grid.columnOrder.splice(index, 0, column);
            }
          }
          grid.columns.push({id: column, accessorKey: column, header: column, visible: visible, type: 'string', enableSorting: enableSorting, cellRendererType: columnRenderType});
          grid.columnVisibility[column] = visible;
        }
      }
    },

    columnChangeOrder(state, action: PayloadAction<{ name: string; updater: MRT_Updater<MRT_ColumnOrderState> }>) {
      const {name, updater} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        if (typeof updater === 'function') {
          grid.columnOrder = updater(grid.columnOrder);
        } else {
          grid.columnOrder = updater;
        }
      }
    },

    columnChangeVisibility(state, action: PayloadAction<{
      name: string;
      columnVisibility: Record<string, boolean> // Map of col id to boolean
    }>) {
      const {name, columnVisibility} = action.payload;
      if (state.byName[name]) {
        state.byName[name].columnVisibility = columnVisibility;
      }
    },

    /**
     * Column-scoped reset: restore visibility and order to the grid's base
     * definition, re-injecting the live display columns. Unlike gridReset this
     * leaves filters, sorting, pagination and selection untouched — it backs
     * the "Reset" action inside the column manager dialog (UTR-000217).
     */
    columnManagerToggle(state, action: PayloadAction<{ name: string; open?: boolean }>) {
      const {name, open} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.columnManagerOpen = open ?? !grid.columnManagerOpen;
      }
    },

    columnsReset(state, action: PayloadAction<{ name: string }>) {
      const {name} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.columnOrder = withLiveDisplayColumns(grid.columnOrder, grid.baseColumnOrder);
        grid.columnVisibility = {...grid.baseColumnVisibility};
      }
    },

    /**
     * Deleted state is responsible for the request query and allows displaying soft deleted records
     */
    deletedStateToggle(state, action: PayloadAction<{ gridName: GridName }>) {
      const {gridName} = action.payload;
      const deletedState = state.byName[gridName].deletedState;

      switch (deletedState) {
        case DeletedState.DS_ONLY_DELETED:
          state.byName[gridName].deletedState = DeletedState.DS_ALL;
          break;
        case DeletedState.DS_ALL:
          state.byName[gridName].deletedState = DeletedState.DS_NOT_DELETED;
          break;
        case DeletedState.DS_NOT_DELETED:
          state.byName[gridName].deletedState = DeletedState.DS_ONLY_DELETED;
          break;
        default:
          // If the current state is unspecified or any other value, default to DS_ONLY_DELETED
          state.byName[gridName].deletedState = DeletedState.DS_NOT_DELETED;
          break;
      }
    },

    filterRemove(state, action: PayloadAction<{ gridName: GridName; id: string }>) {
      const {gridName, id} = action.payload;
      const grid = state.byName[gridName];
      if (grid) {
        grid.filters = grid.filters.filter((f) => f.id !== id);
      }
    },

    filterSet(state, action: PayloadAction<{ gridName: GridName; id: string; operator: WhereOperator; value: any }>) {
      const {gridName, id, operator, value} = action.payload;
      const grid = state.byName[gridName];
      if (grid) {
        const filter = {id, operator, value};
        grid.filters = grid.filters.filter((f) => f.id !== id);
        const matchingOvrride = grid.overrideFilters?.find(f => f.id === id)
        if (matchingOvrride) {
          grid.filters.push(matchingOvrride);
        } else if (!(value === '' || value === undefined || value === null)) {
            grid.filters.push(filter);
        }
      }
    },

    filtersClear(state, action: PayloadAction<{ gridName: GridName }>) {
      const {gridName} = action.payload;
      const grid = state.byName[gridName];
      if (grid) {
        grid.filters = [];
      }
    },

    gridInitialise(state, action: PayloadAction<{ grid: GeneratedGrid, overrideFilters?: GridReduxStateFilter[] }>) {
      const {grid, overrideFilters} = action.payload;
      const columnDefinitions = columnBuilder(grid);
      const name = grid.name;
      const columnIds = columnDefinitions.map(c => c.id);
      const quickFilters = grid.filters.filter(f => f.quick).map(f => f.id);

      if (!state.byName[name]) {
        const gridState = getInitialGridState();
        gridState.columns.push(...columnDefinitions);

        gridState.columnOrder = columnIds;
        gridState.baseColumnOrder = columnIds;

        gridState.columnVisibility = columnDefinitions.reduce<Record<string, boolean>>((acc, col) => {
          acc[col.id] = col.visible;
          return acc;
        }, {});
        gridState.baseColumnVisibility = gridState.columnVisibility;

        gridState.quickFilters = quickFilters;
        gridState.baseQuickFilters = quickFilters;
        gridState.filters = [];
        gridState.overrideFilters = [];

        if (overrideFilters) {
          gridState.filters = overrideFilters
          gridState.overrideFilters = overrideFilters
        }

        gridState.initialised = true;
        state.byName[name] = gridState;
      } else {
        // Reconcile static column metadata from the generated grid def onto
        // the persisted state so new fields (e.g. filterField) propagate to
        // users whose grid state was saved before the field existed. User
        // preferences (columnOrder, columnVisibility, sorting, filters) stay
        // intact because they're keyed by column id.
        const persisted = state.byName[name];
        const persistedById = new Map(persisted.columns.map(c => [c.id, c]));
        persisted.columns = columnDefinitions.map(fresh => {
          const old = persistedById.get(fresh.id);
          return old ? { ...old, ...fresh } : fresh;
        });
      }
    },

    gridReset(state, action: PayloadAction<{ name: string }>) {
      const {name} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.columnOrder = withLiveDisplayColumns(grid.columnOrder, grid.baseColumnOrder);
        grid.columnVisibility = grid.baseColumnVisibility;
        grid.rowSelection = {};
        grid.sorting = [];
        grid.pagination = {pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE};
        grid.filters = [...(grid.overrideFilters || [])];
        grid.quickFilters = grid.baseQuickFilters;
        grid.deletedState = DeletedState.DS_NOT_DELETED;
      }
    },

    gridSaveToActiveView(state, action: PayloadAction<{ gridName: GridName; }>) {
      const {gridName} = action.payload;
      const encoded = encode(state.byName[gridName]);
      state.views[gridName] = state.views[gridName].map((view) =>
        view.isActive ? {...view, gridState: encoded} : view,
      );
    },

    overrideFiltersSet(state, action: PayloadAction<{ gridName: GridName; overrideFilters: any }>) {
      const {gridName, overrideFilters} = action.payload;
      const grid = state.byName[gridName];
      if (grid && overrideFilters) {
        grid.overrideFilters = overrideFilters;
        const overrideIds = new Set(overrideFilters.map((f: { id: string }) => f.id));
        const userFilters = grid.filters.filter((f) => !overrideIds.has(f.id));
        grid.filters = [...userFilters, ...overrideFilters];
      }
    },

    paginationChange(state, action: PayloadAction<{
      name: string;
      pagination: { pageIndex: number; pageSize: number }
    }>) {
      const {name, pagination} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.pagination = pagination;
      }
    },

    quickFiltersSet(state, action: PayloadAction<{ name: string; quickFilters: string[] }>) {
      const {name, quickFilters} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.quickFilters = quickFilters;
      }
    },

    rowSelect(state, action: PayloadAction<{ name: string; rowId: string; multi?: boolean }>) {
      const {name, rowId, multi} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        if (grid.rowSelection[rowId]) {
          delete grid.rowSelection[rowId];
        } else {
          if (!multi) {
            grid.rowSelection = {};
          }
          grid.rowSelection[rowId] = true;
        }
      }
    },

    rowSelectionChange(state, action: PayloadAction<{
      name: string;
      rowSelection: Record<string, boolean>
    }>) {
      const {name, rowSelection} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.rowSelection = rowSelection;
      }
    },

    rowSelectionClear(state, action: PayloadAction<{ name: string }>) {
      const {name} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.rowSelection = {};
      }
    },

    // Set the active view
    sortingChange(state, action: PayloadAction<{
      name: string;
      sorting: { desc: boolean; id: string }[]
    }>) {
      const {name, sorting} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        grid.sorting = sorting;
      }
    },

    // Save the current grid state for the active view
    tokenDecode(state, action: PayloadAction<{ name: string, token: string }>) {
      const {name, token} = action.payload;
      const grid = state.byName[name];
      if (grid) {
        const decoded = decode(token);
        grid.columnOrder = withLiveDisplayColumns(grid.columnOrder, decoded.columnOrder);
        grid.columnVisibility = decoded.columnVisibility;
        grid.rowSelection = decoded.rowSelection;
        grid.filters = decoded.filters;
        grid.sorting = decoded.sorting;
        grid.pagination = decoded.pagination;
        grid.deletedState = decoded.deletedState;
      }
    },

    // Toggle auto-save for a view
    totalItemCountSet(state, action: PayloadAction<{ gridName: GridName; totalItemCount: number | undefined }>) {
      const {gridName, totalItemCount} = action.payload;

      const grid = state.byName[gridName];
      if (grid) {
        grid.totalItemCount = totalItemCount;
      }
    },

    viewAdd(
      state,
      action: PayloadAction<{ gridName: GridName; viewName: string; fromBase?: boolean }>,
    ) {
      const {gridName, viewName, fromBase} = action.payload;

      const existingView = state.views[gridName]?.find((view) => view.viewName === viewName);
      if (existingView) {
        return;
      }

      const views = state.views[gridName] || [];
      const grid = state.byName[gridName];
      const snapshotSource = fromBase
        ? {
            ...getInitialGridState(),
            columnOrder: grid?.baseColumnOrder ?? [],
            columnVisibility: grid?.baseColumnVisibility ?? {},
          }
        : grid;
      state.views[gridName] = [
        ...views.map((view) => ({...view, isActive: false, autoSave: false})),
        {
          viewName,
          isActive: true,
          autoSave: false,
          gridState: encode(snapshotSource),
        },
      ];
    },

    viewRemove(state, action: PayloadAction<{ gridName: GridName; viewName: string }>) {
      const {gridName, viewName} = action.payload;
      state.views[gridName] = state.views[gridName].filter((view) => view.viewName !== viewName);
    },

    viewRename(
      state,
      action: PayloadAction<{ gridName: GridName; previousName: string; newName: string }>,
    ) {
      const {gridName, previousName, newName} = action.payload;

      state.views[gridName] = state.views[gridName].map((view) =>
        view.viewName === previousName
          ? {...view, viewName: newName}
          : view,
      );
    },

    viewSetActive(
      state,
      action: PayloadAction<{ gridName: GridName; viewName: string; }>,
    ) {
      const {gridName, viewName} = action.payload;

      state.views[gridName] = state.views[gridName]?.map((view) => ({
        ...view,
        isActive: view.viewName === viewName,
      })) || [];

      const activeView = state.views[gridName].find((view) => view.isActive);
      if (activeView && state.byName[gridName]) {
        const decoded = decode(activeView.gridState);
        state.byName[gridName].columnOrder = withLiveDisplayColumns(
          state.byName[gridName].columnOrder,
          decoded.columnOrder,
        );
        state.byName[gridName].columnVisibility = decoded.columnVisibility;
        state.byName[gridName].rowSelection = decoded.rowSelection;
        state.byName[gridName].sorting = decoded.sorting;
        state.byName[gridName].pagination = decoded.pagination;
        state.byName[gridName].filters = decoded.filters;
        state.byName[gridName].deletedState = decoded.deletedState;
      }
    },

    viewToggleAutosave(state, action: PayloadAction<{ gridName: GridName; viewName: string }>) {
      const {gridName, viewName} = action.payload;

      state.views[gridName] = state.views[gridName].map((view) =>
        view.viewName === viewName ? {...view, autoSave: !view.autoSave} : view,
      );
    },

    viewSetFavourite(state, action: PayloadAction<{ gridName: GridName; viewName: string }>) {
      const {gridName, viewName} = action.payload;
      const views = state.views[gridName] || [];
      const target = views.find(v => v.viewName === viewName);
      const turningOff = !!target?.isFavourite;

      state.views[gridName] = views.map(view => ({
        ...view,
        isFavourite: turningOff ? false : view.viewName === viewName,
      }));
    },

    viewDuplicate(state, action: PayloadAction<{ gridName: GridName; viewName: string }>) {
      const {gridName, viewName} = action.payload;
      const views = state.views[gridName] || [];
      const source = views.find(v => v.viewName === viewName);
      if (!source) return;

      const existingNames = new Set(views.map(v => v.viewName));
      let copyName = `${viewName} (copy)`;
      let suffix = 2;
      while (existingNames.has(copyName)) {
        copyName = `${viewName} (copy ${suffix})`;
        suffix += 1;
      }

      state.views[gridName] = [
        ...views,
        {
          viewName: copyName,
          isActive: false,
          autoSave: false,
          isFavourite: false,
          gridState: source.gridState,
        },
      ];
    },
  },
});

export const {
  columnAdd,
  columnChangeOrder,
  columnChangeVisibility,
  columnManagerToggle,
  columnsReset,
  deletedStateToggle,
  filterRemove,
  filterSet,
  filtersClear,
  gridInitialise,
  gridReset,
  gridSaveToActiveView,
  overrideFiltersSet,
  paginationChange,
  quickFiltersSet,
  rowSelect,
  rowSelectionChange,
  rowSelectionClear,
  sortingChange,
  tokenDecode,
  totalItemCountSet,
  viewAdd,
  viewDuplicate,
  viewRemove,
  viewRename,
  viewSetActive,
  viewSetFavourite,
  viewToggleAutosave,
} = gridsSlice.actions;

export const GridsReducer = gridsSlice.reducer;

const DEFAULT_PAGE_SIZE = 100;
