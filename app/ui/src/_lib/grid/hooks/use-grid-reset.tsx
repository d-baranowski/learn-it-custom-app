import {useGridDispatch} from '~/_lib/grid/state/hooks';
import React from 'react';
import {gridReset} from '~/_lib/grid/state/grids-slice';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';

const useGridReset = () => {
  const {gridName} = useGridSettings();
  const dispatch = useGridDispatch();

  const reset = React.useCallback(() => {
    dispatch(gridReset({ name: gridName }));
  }, [dispatch, gridName]);

  return { reset };
};

export default useGridReset;
