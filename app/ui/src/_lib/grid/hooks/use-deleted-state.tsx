import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import React from 'react';
import {deletedStateToggle, getInitialGridState} from '~/_lib/grid/state/grids-slice';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';

const initialState = getInitialGridState();

const useDeletedState = () => {
  const {gridName} = useGridSettings();
  const dispatch = useGridDispatch();

  const state = useGridSelector(state => state?.grids?.byName[gridName]?.deletedState || initialState.deletedState);
  const toggle = React.useCallback(() => {
    dispatch(deletedStateToggle({ gridName: gridName }));
  }, [dispatch, gridName]);

  return { toggle, state };
};

export default useDeletedState;
