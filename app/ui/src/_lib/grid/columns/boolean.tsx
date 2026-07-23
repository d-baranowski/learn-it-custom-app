import {GridColumn} from '@gen/grids';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {YesNoCellRenderer} from "~/_lib/grid/grid-cells/yes-no";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";

export function booleanColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'boolean',
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}

export const booleanCell: (col: ReduxStoreColumnDef) => CellRenderer = () => ({cell}) => YesNoCellRenderer(cell.getValue<boolean>());
