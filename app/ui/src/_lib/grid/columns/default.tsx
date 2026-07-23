import {GridColumn} from "@gen/grids";
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';

export function defaultColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}
