import {getInitialGridState} from '~/_lib/grid/state/grids-slice';
import {useGridSelector} from '~/_lib/grid/state/hooks';


const defaultGridState = getInitialGridState();

export const useRowCount = (gridName: string): number | undefined => {
  return useGridSelector(state => state?.grids?.byName[gridName]?.totalItemCount);
}

export const useRowSelection = (gridName: string) => {
  return useGridSelector(state => state?.grids?.byName[gridName]?.rowSelection || defaultGridState.rowSelection);
}

export const useSorting = (gridName: string) => {
  return useGridSelector(state => state?.grids?.byName[gridName]?.sorting || defaultGridState.sorting);
}

export const usePagination = (gridName: string) => {
  return useGridSelector(state => state?.grids?.byName[gridName]?.pagination || defaultGridState.pagination);
}

export const useColumnVisibility = (gridName: string) => {

  return useGridSelector(state => {
    const v = state?.grids?.byName[gridName]?.columnVisibility
    if (v === undefined) {
      return {}
    }
    if (v === null) {
      return {}
    }

    return v
  });
}

export const useColumnOrder = (gridName: string) => {
  return useGridSelector(state => state?.grids?.byName[gridName]?.columnOrder || defaultGridState.columnOrder);
}

export const useDeletedState = (gridName: string) => {
  return useGridSelector(state => state?.grids?.byName[gridName]?.deletedState || defaultGridState.deletedState);
}
