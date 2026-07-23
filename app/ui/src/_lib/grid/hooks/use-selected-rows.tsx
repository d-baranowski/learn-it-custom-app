import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import React from 'react';
import {rowSelectionClear} from '~/_lib/grid/state/grids-slice';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';

const useSelectedRows = () => {
  const {gridName} = useGridSettings();

  const dispatch = useGridDispatch();
  const rowSelection = useGridSelector(state => state?.grids?.byName[gridName]?.rowSelection);
  const count = Object.entries(rowSelection).filter(([k, v]) => v).length;
  const ids = Object.entries(rowSelection).filter(([k, v]) => v).map(([k, v]) => k);
  const clear = React.useCallback(() => {
    dispatch(rowSelectionClear({ name: gridName }));
  }, [dispatch, gridName]);

  return { count, ids, clear };
};

export default useSelectedRows;
