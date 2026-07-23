import {useGridSelector} from '~/_lib/grid/state/hooks';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import {DecodeResult, encode} from '~/_lib/grid/encode';
import {getInitialGridState} from '~/_lib/grid/state/grids-slice';

const initialState = getInitialGridState();

const useEncodedGridState = () => {
  const {gridName} = useGridSettings();

  const columnOrder = useGridSelector(state => state?.grids?.byName[gridName]?.columnOrder || initialState.columnOrder);
  const columnVisibility = useGridSelector(state => state?.grids?.byName[gridName]?.columnVisibility || initialState.columnVisibility);
  const pagination = useGridSelector(state => state?.grids?.byName[gridName]?.pagination || initialState.pagination);
  const rowSelection = useGridSelector(state => state?.grids?.byName[gridName]?.rowSelection || initialState.rowSelection);
  const sorting = useGridSelector(state => state?.grids?.byName[gridName]?.sorting || initialState.sorting);
  const filters = useGridSelector(state => state?.grids?.byName[gridName]?.filters || initialState.sorting);
  const deletedState = useGridSelector(state => state?.grids?.byName[gridName]?.deletedState || initialState.deletedState);

  const encodable: DecodeResult = {
    columnOrder: columnOrder,
    columnVisibility: columnVisibility,
    pagination: pagination,
    rowSelection: rowSelection,
    sorting: sorting,
    filters: filters,
    deletedState: deletedState,
  };

  const encoded = encode(encodable);

  return { encoded, encodable };
};

export default useEncodedGridState;
