import {messages} from '@gen/factory';
import React, {useEffect} from 'react';
import {MethodUnaryDescriptor} from '@connectrpc/connect-query';
import {SelectRequest} from '@gen/request/v1/base_pb';
import {toast} from 'react-hot-toast';
import {SelectFieldPath} from '~/request/types';
import {GenericListResponse} from '~/_lib/grid/types/list-response';
import {totalItemCountSet} from '~/_lib/grid/state/grids-slice';
import {useGridDispatch} from '~/_lib/grid/state/hooks';
import useGridQuery from './use-grid-query';


interface Props<K extends keyof typeof messages, O> {
  name: string;
  type: K;
  list: MethodUnaryDescriptor<SelectRequest, GenericListResponse<O>>;
  select?: (SelectFieldPath<typeof messages[K]['interface']> | '*')[];
}

function useGridWithStore<K extends keyof typeof messages, O>(props: Props<K, O>) {
  const dispatch = useGridDispatch();
  const { isError, error, data, isLoading, isFetching, refetch } = useGridQuery({
    ...props,
    requestMode: 'data',
  });
  const countQuery = useGridQuery({
    ...props,
    requestMode: 'count',
    enabled: !isLoading && !isFetching && !isError,
  });

  if (isError) {
    console.error('Query Error:', error);
  }

  React.useEffect(() => {
    if (error?.message?.length || 0 > 0) {
      toast.error('Error while fetching grid data: ' + error?.message);
    }
  }, [error]);

  useEffect(() => {
    if (isError) {
      toast.error('Error fetching data');
      console.error('Query Error:', error);
    }
  }, [isError, error]);

  useEffect(() => {
    // The count query is keyed on everything that affects the total (filters,
    // deleted-state, search) but NOT pagination, so react-query already
    // refetches it exactly when the total can change. Trust its result
    // whenever it's present.
    //
    // Previously the total was only accepted when the count was at least as
    // fresh as the data query (countQuery.dataUpdatedAt >= dataUpdatedAt).
    // Paging fetches new data without refetching the pagination-independent
    // count, so that guard cleared the total on every page change. With the
    // total gone, rowCount fell back to the current page's row length (a
    // single page), MRT clamped pageIndex back to 0, and no grid could leave
    // page 1.
    if (countQuery.data?.pagination) {
      dispatch(totalItemCountSet({
        gridName: props.name,
        totalItemCount: countQuery.data.pagination.total,
      }));
    }
  }, [countQuery.data?.pagination, dispatch, props.name]);

  // Mutations (create/delete) and manual refresh all flow through `refetch`.
  // The count query is keyed on filters/deleted-state, none of which change on
  // a mutation, so react-query would leave a stale total behind (e.g. deleting
  // the last matching row empties the data but the pager still reads "1 of 1").
  // Refetch the count alongside the data so the total tracks the mutation.
  // Pagination does NOT go through here — it re-keys the data query directly —
  // so this doesn't reintroduce the paging regression.
  const refetchAll = React.useCallback(() => {
    void countQuery.refetch();
    return refetch();
  }, [refetch, countQuery.refetch]);

  return {
    data,
    isLoading,
    isFetching: isFetching || countQuery.isFetching,
    isError,
    error,
    refetch: refetchAll,
  };
}

export default useGridWithStore;
