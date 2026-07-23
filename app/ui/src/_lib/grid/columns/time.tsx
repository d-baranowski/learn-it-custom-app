import {GridColumn} from "@gen/grids";
import {prettyPrintTime} from "~/utils/date";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";

export function timeColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "time",
    header: col.header,
    visible: col.visible,
  };
}

export const timeCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function TimeCell({cell}) {
    const val = cell.getValue<bigint>()
    if (!val) return <></>
    return prettyPrintTime(val)
  }
