import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import React from 'react';
import {gridSaveToActiveView} from '~/_lib/grid/state/grids-slice';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import useEncodableGridState from './use-encodable-grid-state';

const useGridView = () => {
  const {gridName} = useGridSettings();
  const dispatch = useGridDispatch();
  const views = useGridSelector(state => state?.grids?.views[gridName]);
  const activeView = views?.find(v => v.isActive);
  const { encoded } = useEncodableGridState();
  const isDirty = activeView?.gridState !== encoded;

  const save = React.useCallback(() => {
    dispatch(gridSaveToActiveView({ gridName: gridName }));
  }, [dispatch, gridName]);

  React.useEffect(() => {
    if (isDirty && activeView?.autoSave) {
      dispatch(gridSaveToActiveView({ gridName: gridName }));
    }
  }, [isDirty, encoded, activeView?.autoSave, dispatch, gridName]);

  return { activeView, save, isDirty };
};

export default useGridView;
