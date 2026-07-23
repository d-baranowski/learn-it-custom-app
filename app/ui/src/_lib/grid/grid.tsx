import {
  MRT_ColumnOrderState,
  MRT_PaginationState,
  MRT_RowSelectionState,
  MRT_SortingState, type MRT_TableInstance,
  MRT_TableOptions,
  MRT_Updater,
  MRT_VisibilityState,
} from 'material-react-table';
import React, { ReactNode, useEffect } from 'react';
import Box from '@mui/material/Box';
import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import QuickPanel from '~/_lib/grid/filter/quick-panel';
import {Grid as GeneratedGrid} from '@gen/grids';
// todo we're getting constant hydration errors due to the state living in local storage if we move the state to the
// server we could avoid some of those issues. but then the question is how responsive the ui will be
// for now avoiding ssr for those components seems line the way to go
import dynamic from "next/dynamic";
import {GridContextMenuItems, PureGridType} from "~/_lib/grid/pure-grid";
const PureGrid = dynamic(() => import("./pure-grid"), { ssr: false });

import {toMrtColumnDev} from '~/_lib/grid/columns/column_builder';
import {
  columnAdd,
  columnChangeOrder,
  columnChangeVisibility,
  columnManagerToggle,
  filterSet,
  filtersClear,
  paginationChange,
  rowSelect,
  rowSelectionChange,
  sortingChange,
} from '~/_lib/grid/state/grids-slice';
import { WhereOperator } from '@gen/request/v1/base_pb';
import FiltersModal from '~/_lib/grid/filter/filters-modal';
import GridToolbarActions from './grid-toolbar-actions';
import {
  useColumnOrder,
  useColumnVisibility,
  usePagination,
  useRowCount,
  useRowSelection,
  useSorting,
} from '~/_lib/grid/hooks/use-grid-state';
import {GridColumnDef} from './types/column';
import {useTranslation} from 'next-i18next';
import useDialogOpenHandler from '~/_lib/grid/hooks/use-dialog-open-handler';
import { useFormRegistry } from '~/hooks/use-form-registry';
import { FormProps } from '~/components/form/form-props';
import { OutPortal } from '~/_lib/portals/in-out-portals';

export const GRID_TOKEN_SEARCH_PARAM = 'gt';

type GridOptions<T extends Record<string, any>> = Omit<MRT_TableOptions<T>,
  'columns' | 'data' | 'rowCount' | 'state'>;

interface BackgroundOption {
  columnName: string;
  color: string;
  compareValue: any;
}
interface GridProps<T extends Record<string, any>> {
  gridDef: GeneratedGrid;
  contextMenuItems?: GridContextMenuItems<T>;
  data: T[];
  onClickRow?: (row: T) => void;
  options?: GridOptions<T>;
  backgroundOptions?: BackgroundOption[];
  statusCellNumber?: number;

  isLoading: boolean;
  refetch: () => void;
  extraColumns?: GridColumnDef<any>;
  customHeightReduction?: number;
  disableQuickFilters?: boolean;
  quickPanelExtraActions?: (props: {
    table: MRT_TableInstance<T>;
  }) => ReactNode;
}

const Grid = <T extends Record<string, any>>(props: GridProps<T>) => {
  const {
    gridDef,
    contextMenuItems,
    isLoading,
    onClickRow,
    options,
    backgroundOptions,
    statusCellNumber,
    refetch,
    extraColumns,
  } = props;

  const name = gridDef.name;
  const { t, i18n } = useTranslation('common');
  const PG = PureGrid as unknown as PureGridType<T>

  const dispatch = useGridDispatch();
  const rowSelection = useRowSelection(name);
  const rowCount = useRowCount(name);
  const columnVisibility = useColumnVisibility(name);
  const columnOrder = useColumnOrder(name);
  const sorting = useSorting(name);
  const pagination = usePagination(name);

  const storeColumns = useGridSelector(state => state?.grids?.byName[name]?.columns);
  const isInitialised = useGridSelector(state => state?.grids?.byName[name]?.initialised);
  const activeFilters = useGridSelector(state => state?.grids?.byName[name]?.filters);
  const hasActiveFilters = !!activeFilters && activeFilters.length > 0;
  const recentEntry = useGridSelector(state => state?.recentlyOpened?.byGrid[name]);
  const recentRowId = React.useMemo(() => {
    const entry = Array.isArray(recentEntry) ? recentEntry[0] : recentEntry;
    if (!entry || typeof entry.openedAt !== 'number') return undefined;
    const RECENT_WINDOW_MS = 10 * 60 * 1000;
    return entry.openedAt >= Date.now() - RECENT_WINDOW_MS
      ? entry.rowId
      : undefined;
  }, [recentEntry]);
  const columns = React.useMemo(() => {
    const cols = storeColumns?.map(col => toMrtColumnDev<T>(col, t)) || [];
    if (extraColumns) {
      cols.push(extraColumns);
    }
    return cols;
  }, [storeColumns, extraColumns, t, i18n.language]);

  const hasColumn = React.useCallback((id: string) => {
    return !!storeColumns?.find(s => s.id === id);
  }, [storeColumns]);

  const addColumnHandler = React.useCallback((id: string, visible: boolean, position: string | null | undefined) => {
    dispatch(columnAdd({
      name: name,
      column: id,
      visible: visible,
      position: position,
    }));
  }, [dispatch, name]);

  const selectRowHandler = React.useCallback((id: string, multi?: boolean) => {
    dispatch(rowSelect({
      name: name,
      rowId: id,
      multi: multi,
    }));
  }, [dispatch, name]);

  const onRowSelectionChangedHandler = React.useCallback((updater: MRT_Updater<MRT_RowSelectionState>) => {
    let payload: Record<string, boolean>;

    if (typeof updater === 'function') {
      payload = updater(rowSelection);
    } else {
      payload = updater;
    }

    dispatch(rowSelectionChange({
      name: name,
      rowSelection: payload
    }));
  }, [dispatch, name, rowSelection]);

  const columnOrderChangeHandler = React.useCallback((updater: MRT_Updater<MRT_ColumnOrderState>) => {
    dispatch(columnChangeOrder({
      name: name,
      updater: updater,
    }));
  }, [dispatch, name]);

  const pendingVisibilityRef = React.useRef<Record<string, boolean> | null>(null);
  const flushTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const columnVisibilityChangeHandler = React.useCallback((updater: MRT_Updater<MRT_VisibilityState>) => {
    const base = pendingVisibilityRef.current ?? columnVisibility;
    let payload: Record<string, boolean>;

    if (typeof updater === 'function') {
      payload = updater(base);
    } else {
      payload = updater;
    }

    pendingVisibilityRef.current = payload;

    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      if (pendingVisibilityRef.current) {
        dispatch(columnChangeVisibility({
          name: name,
          columnVisibility: pendingVisibilityRef.current,
        }));
        pendingVisibilityRef.current = null;
      }
    }, 0);
  }, [dispatch, name, columnVisibility]);

  const openColumnManagerHandler = React.useCallback(() => {
    dispatch(columnManagerToggle({ name, open: true }));
  }, [dispatch, name]);

  const onSortingChangeHandler = React.useCallback((updater: MRT_Updater<MRT_SortingState>) => {
    console.log("DEBUG ON Sorting change handler")
    let payload: { desc: boolean; id: string }[];

    if (typeof updater === 'function') {
      payload = updater(sorting);
    } else {
      payload = updater;
    }

    dispatch(sortingChange({
      name: name,
      sorting: payload
    }));
  }, [dispatch, name, sorting]);

  const onPaginationChangeHandler = React.useCallback((updater: MRT_Updater<MRT_PaginationState>) => {
    let payload: { pageIndex: number; pageSize: number };

    if (typeof updater === 'function') {
      payload = updater(pagination);
    } else {
      payload = updater;
    }

    dispatch(paginationChange({
      name: name,
      pagination: payload
    }));
  }, [dispatch, name, pagination]);

  const openDialogHandler = useDialogOpenHandler<T>()

  const onFilterCellHandler = React.useCallback(
    (filterField: string, value: unknown, operator: WhereOperator) => {
      dispatch(filterSet({
        gridName: name,
        id: filterField,
        operator,
        value,
      }));
    },
    [dispatch, name],
  );

  const onClearFiltersHandler = React.useCallback(() => {
    dispatch(filtersClear({ gridName: name }));
  }, [dispatch, name]);

  const { registerForm, registry } = useFormRegistry();

  const mainFiltersRegistryName = gridDef.name + '_filters-modal';
  useEffect(() => {
    if (registry[mainFiltersRegistryName]) {
      return;
    }
    registerForm(mainFiltersRegistryName, (props: FormProps<any>) => (
      <OutPortal id={mainFiltersRegistryName} />
    ));
  }, [registerForm, mainFiltersRegistryName, registry]);


  if (!columnVisibility) {
    return <Box sx={{ height: '100%' }} data-testid={'rpg-grid-component-wrapper'}></Box>;
  }

  if (!isInitialised) {
    return <Box sx={{ height: '100%' }} data-testid={'rpg-grid-component-wrapper'}></Box>;
  }

  return (
    <Box sx={{ height: '100%' }} data-testid={'rpg-grid-component-wrapper'}>
      <PG
        key={i18n.language}
        columns={columns}
        rowCount={rowCount ?? props.data.length}
        hasColumn={hasColumn}
        addColumn={addColumnHandler}
        rowSelection={rowSelection}
        selectRow={selectRowHandler}
        sorting={sorting}
        pagination={pagination}
        isLoading={isLoading}
        recentRowId={recentRowId}
        columnVisibility={columnVisibility}
        columnOrder={columnOrder}
        data={props.data}
        onOpenColumnManager={openColumnManagerHandler}
        onColumnOrderChange={columnOrderChangeHandler}
        onColumnVisibilityChange={columnVisibilityChangeHandler}
        onRowSelectionChange={onRowSelectionChangedHandler}
        onSortingChange={onSortingChangeHandler}
        onPaginationChange={onPaginationChangeHandler}
        contextMenuItems={contextMenuItems}
        enableTopToolbar={true}
        onClickRow={onClickRow}
        onDoubleClickRow={openDialogHandler}
        backgroundOptions={backgroundOptions}
        statusCellNumber={statusCellNumber}
        customHeightReduction={props.customHeightReduction}
        onFilterCell={onFilterCellHandler}
        onClearFilters={onClearFiltersHandler}
        hasActiveFilters={hasActiveFilters}
        renderTopToolbarCustomActions={({ table }) => {
          if (props.disableQuickFilters) return null;
          return <QuickPanel grid={gridDef} />;
        }}
        renderToolbarInternalActions={({ table }) => {
          return (
            <GridToolbarActions
              hasQuickFilters={!props.disableQuickFilters}
              hasMoreFilters={true}
              table={table}
              refetch={props.refetch}
            />
          );
        }}
      />
      <FiltersModal grid={gridDef} />
    </Box>
  );
};

export default Grid;
