import React from 'react';
import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import {gridInitialise} from '../state/grids-slice';
import {Grid} from '@gen/grids';

function useGridInitialise(gridDef: Grid) {
  const dispatch = useGridDispatch();
  const gridInitialised = useGridSelector(state => state?.grids.byName[gridDef.name]?.initialised);
  React.useEffect(() => {
    if (!gridInitialised) {
      dispatch(gridInitialise({ grid: gridDef }));
    }
  }, [gridInitialised, dispatch, gridDef]);
}

export default useGridInitialise;
