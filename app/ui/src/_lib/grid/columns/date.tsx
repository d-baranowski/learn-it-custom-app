import {GridColumn} from "@gen/grids";
import {usePrettyPrintDate} from "~/utils/date";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";

export function dateColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "date",
    header: col.header,
    visible: col.visible,
  };
}

export const dateCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function DateCell({cell}) {
    const prettyDate = usePrettyPrintDate();
    const val = cell.getValue<bigint>()
    if (!val) return <></>
    return <>{prettyDate(val)}</>
  }
