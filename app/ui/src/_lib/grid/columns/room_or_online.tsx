import { useTranslation } from 'next-i18next';
import { GridColumn } from '@gen/grids';
import { ReduxStoreColumnDef } from '~/_lib/grid/columns/types';
import { CellRenderer } from '~/_lib/grid/columns/cell_renderers';
import { WhereOperator } from '@gen/request/v1/base_pb';
import type { CellFilterResolver } from '~/_lib/grid/columns/cell_filter_resolvers';

type RoomOrOnlineRow = {
  isOnline?: boolean;
  roomLabel?: string;
};

export function roomOrOnlineColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'roomOrOnline',
    header: col.header,
    visible: col.visible,
    type: col.type,
    enableSorting: col.enableSorting,
  };
}

export const roomOrOnlineCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function RoomOrOnlineCell({ cell }) {
    const { t } = useTranslation('common');
    const row = cell.row.original as RoomOrOnlineRow;
    if (row?.isOnline) {
      return <span>{t('Online')}</span>;
    }
    const value = cell.getValue() as string | undefined;
    return <span>{value ?? ''}</span>;
  };

export const roomOrOnlineFilterResolver: CellFilterResolver = (row) => {
  const r = row as RoomOrOnlineRow & { roomId?: string };
  if (r?.isOnline) {
    return { field: 'isOnline', value: true, operator: WhereOperator.EQ, label: 'Online' };
  }
  if (r?.roomId) {
    return {
      field: 'roomId',
      value: r.roomId,
      operator: WhereOperator.EQ,
      label: r.roomLabel ?? '',
    };
  }
  return null;
};
