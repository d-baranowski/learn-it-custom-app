import {DeletedState, OrderBy, OrderDirection, Pagination, SelectRequest} from '@gen/request/v1/base_pb';
import {BaseBuilder} from '~/request/builder';
import {OrderByField, SelectFieldPath} from '~/request/types';
import {messages} from '@gen/factory';

class SelectBuilder<K extends keyof typeof messages> extends BaseBuilder<K> {
  private fields = new Set<string>();
  private order: OrderBy[] = [];
  private pagination?: Pagination;
  private selectAll = false;
  public deletedState = DeletedState.DS_NOT_DELETED;
  public headers: Record<string, string> = {};
  public request?: SelectRequest = undefined;

  constructor(k: K) {
    super(k);
  }

  select(fields: SelectFieldPath<typeof messages[K]['interface']>[]) {
    this.fields = new Set(fields)
    return this
  }

  setSelectAll() {
    this.selectAll = true;
    return this
  }

  addSelect(field: SelectFieldPath<typeof messages[K]['interface']>) {
    this.fields.add(field)
    return this
  }

  orderBy(order: OrderByField<typeof messages[K]['interface']>[]) {
    this.order = order.map(o => new OrderBy(o))
    return this
  }

  addOrderBy(field: SelectFieldPath<typeof messages[K]['interface']>, direction: OrderDirection = OrderDirection.ASC) {
    this.order.push(new OrderBy({field, direction}))
    return this
  }

  resetOrderBy() {
    this.order = [];
    return this
  }

  paginate(take: number, skip: number) {
    this.pagination = new Pagination({
      take,
      skip
    })
    return this
  }

  setDeletedState(state: DeletedState) {
    this.deletedState = state
    return this
  }

  setHeader(key: string, value: string) {
    this.headers[key] = value;
    this.build();
    return this
  }

  setHeaders(headers: Record<string, string>) {
    this.headers = headers;
    this.build();
    return this
  }

  removeHeader(key: string) {
    delete this.headers[key];
    this.build();
    return this
  }

  resetHeaders() {
    this.headers = {};
    this.build();
    return this
  }

  build() {
    const r = new SelectRequest();
    if (this.selectAll) {
      r.selectAll = true
    } else {
      r.select = [...Array.from(this.fields)]
    }
    r.where = this.wb.build()
    r.order = this.order
    r.pagination = this.pagination
    r.deletedState = this.deletedState

    this.request = r;

    return this
  }
}

export default SelectBuilder
