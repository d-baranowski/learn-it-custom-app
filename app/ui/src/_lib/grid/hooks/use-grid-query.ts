import {MethodUnaryDescriptor, useQuery} from "@connectrpc/connect-query";
import {messages} from "@gen/factory";
import {OrderDirection, SelectRequest} from "@gen/request/v1/base_pb";
import {GenericListResponse} from "~/_lib/grid/types/list-response";
import {SelectFieldPath, WhereFieldPath} from "~/request/types";
import {useDeletedState, usePagination, useSorting} from "~/_lib/grid/hooks/use-grid-state";
import useFilters from "~/_lib/grid/hooks/use-filters";
import {SelectBuilder, WhereBuilder} from "~/request";
import {useGridSelector} from '~/_lib/grid/state/hooks';


interface Props<K extends keyof typeof messages, O> {
  name: string;
  type: K;
  list: MethodUnaryDescriptor<SelectRequest, GenericListResponse<O>>;
  select?: (SelectFieldPath<typeof messages[K]['interface']> | '*')[];
  requestMode?: 'data' | 'count';
  enabled?: boolean;
}

function useGridQuery<K extends keyof typeof messages, O>(props: Props<K, O>) {
  const { list, name, type, select, requestMode = 'data', enabled } = props;

  const deletedState = useDeletedState(name);
  const {filters} = useFilters(name);
  const sorting = useSorting(name);
  const pagination = usePagination(name);
  const columns = useGridSelector(state => state?.grids?.byName[name]?.columns || []);

  const builder = new SelectBuilder<K>(type);

  if (select) {
    // @ts-ignore TODO
    builder.select(props.select);
  } else {
    builder.setSelectAll();
  }

  builder.resetWhere();
  const where = new WhereBuilder<K>();
  filters.forEach(f => {
    // @ts-ignore
    where.clause(f.id, f.operator, f.value, f.id);
  });
  builder.setWhere(where);
  builder.resetOrderBy();
  for (const sort of sorting) {
    const sortColumn = columns.find(column => column.id === sort.id);
    const orderFields = sortColumn?.orderBy?.length
      ? sortColumn.orderBy
      : [sort.id];

    for (const orderField of orderFields) {
      const field = orderField as WhereFieldPath<typeof messages[K]['interface']>;
      // @ts-ignore TODO
      builder.addOrderBy(field, sort.desc ? OrderDirection.DESC : OrderDirection.ASC);
    }
  }

  const skip = pagination.pageIndex * pagination.pageSize;
  const take = pagination.pageSize;
  if (requestMode === 'count') {
    builder.paginate(0, 0);
    builder.setHeader('x-utro-list-count-only', 'true');
  } else {
    builder.paginate(take, skip);
  }

  builder.setDeletedState(deletedState);
  builder.build();

  const req = builder.request;


  return useQuery(list, req, {
    enabled: (enabled ?? true) && req !== undefined,
    callOptions: {
      headers: builder.headers,
    },
  });
}

export default useGridQuery;
