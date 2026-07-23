import {GridColumn} from "@gen/grids";
import {usePrettyPrintDateTime} from "~/utils/date";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";

export function dateTimeColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: "dateTime",
    type: col.type,
    header: col.header,
    visible: col.visible
  };
}

export const dateTimeCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function DateTimeCell({cell}) {
    const prettyDateTime = usePrettyPrintDateTime();
    const val = cell.getValue<bigint>()
    if (!val) return <></>
    return <>{prettyDateTime(val)}</>
  }
