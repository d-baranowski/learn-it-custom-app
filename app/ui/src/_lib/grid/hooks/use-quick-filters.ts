import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import React from 'react';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import {quickFiltersSet} from '~/_lib/grid/state/grids-slice';

const useQuickFilters = () => {
  const {gridName} = useGridSettings();
  const dispatch = useGridDispatch();
  const quickFilters = useGridSelector(state => state?.grids?.byName[gridName]?.quickFilters) || [];
  const setFilters = React.useCallback((newFilters: string[]) => {
    dispatch(quickFiltersSet({ name: gridName, quickFilters: newFilters }));
  }, [dispatch, gridName]);

  return { quickFilters, setFilters };
};

export default useQuickFilters;
