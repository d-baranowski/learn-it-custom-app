import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import React from 'react';
import {filtersClear} from '~/_lib/grid/state/grids-slice';

const useFilters = (gridName: string) => {
  const dispatch = useGridDispatch();

  // Stabilise the empty-array fallback so downstream useMemo deps don't
  // see a fresh reference every render when no filters exist.
  const rawFilters = useGridSelector(state => state?.grids?.byName[gridName]?.filters);
  const filters = React.useMemo(() => rawFilters ?? [], [rawFilters]);

  const hasFilters = React.useMemo(() => filters?.length > 0, [filters])
  const count = React.useMemo(() => filters.length, [filters])

  const ids = React.useMemo(() => {
    return filters.map((f) => f.id);
  }, [filters])

  const values = React.useMemo(() => {
    return filters?.reduce<Record<string, any>>((acc, val) => {
      acc[val.id] = val.value;
      return acc;
    }, {});
  }, [filters])

  const clear = React.useCallback(() => {
    dispatch(filtersClear({gridName: gridName}));
  }, [dispatch, gridName]);

  const result = React.useMemo(() => {
    return {
      count, ids, clear, hasFilters, filters, values
    }
  }, [count, ids, clear, hasFilters, filters, values])


  return result;
};

export default useFilters;
