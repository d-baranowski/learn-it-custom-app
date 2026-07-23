import { WhereOperator } from '@gen/request/v1/base_pb';
import type { CellRendererName } from './cell_renderers';
import { roomOrOnlineFilterResolver } from '~/_lib/grid/columns/room_or_online';
import { customersFilterResolver } from '~/_lib/grid/columns/customers';

export type ResolvedFilter = {
  field: string;
  value: unknown;
  operator: WhereOperator;
  label: string;
};

export type CellFilterResolver = (row: unknown) => ResolvedFilter | null;

const cell_filter_resolvers: Partial<Record<CellRendererName, CellFilterResolver>> = {
  roomOrOnline: roomOrOnlineFilterResolver,
  customers: customersFilterResolver,
};

export default cell_filter_resolvers;
