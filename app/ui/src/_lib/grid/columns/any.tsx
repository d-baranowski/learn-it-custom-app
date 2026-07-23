import {GridColumn} from '@gen/grids';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";

export function anyColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'any',
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}

export const anyCell: (col: ReduxStoreColumnDef) => CellRenderer = (col) => ({cell}) => {
  const val = cell.getValue<any>();
  if (!val) {
    return '';
  }
  return JSON.stringify(val);
};
