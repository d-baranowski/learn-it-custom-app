import {GridColumn} from '@gen/grids';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {Timestamp} from "@bufbuild/protobuf";
import React from "react";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";

export function googleTimestampColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'googleTimestamp',
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}

export const googleTimestampCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function GoogleTimestampCell({cell}) {
    const val = cell.getValue<Timestamp>();
    if (!val) return <></>;
    return val.toDate().toLocaleString();
  };
