import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import React from 'react';
import {filterRemove, filterSet} from '~/_lib/grid/state/grids-slice';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import {WhereOperator} from '@gen/request/v1/base_pb';

interface Props<T = NonNullable<unknown>> {
  id: string;
  defaultOperator?: WhereOperator;
  defaultValue?: NonNullable<T>;
}

function useFilter<T>(props: Props<T>) {
  const {
    id,
    defaultOperator = WhereOperator.EQ,
    defaultValue,
  } = props;

  const {gridName} = useGridSettings();

  const dispatch = useGridDispatch();
  const filters = useGridSelector(state => state?.grids?.byName[gridName]?.filters || []);

  const filter = React.useMemo(() => {
    return filters?.find(f => f.id === id) || {
      id: id,
      operator: defaultOperator,
      value: defaultValue,
    };
  }, [filters, id, defaultOperator, defaultValue]);

  const setValue = React.useCallback((value: T, operator?: WhereOperator) => {
    dispatch(filterSet({
      gridName: gridName, id: id, operator: operator ?? filter.operator, value: value,
    }));
  }, [dispatch, gridName, id, filter]);

  const setOperator = React.useCallback((operator: WhereOperator) => {
    dispatch(filterSet({
      gridName: gridName, id: id, operator: operator, value: filter.value,
    }));
  }, [dispatch, gridName, id, filter]);

  const removeFilter = React.useCallback(() => {
    dispatch(filterRemove({ gridName: gridName, id: id }));
  }, [dispatch, id, gridName]);

  return {
    value: filter.value,
    operator: filter.operator,
    setValue,
    setOperator,
    removeFilter,
  };
}

export default useFilter;
