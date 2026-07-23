import { GridColumn } from "@gen/grids";
import { formatDateString, usePrettyPrintDate } from "~/utils/date";
import { useDateFnsLocale } from "~/utils/locale";
import React from "react";
import { ReduxStoreColumnDef } from "~/_lib/grid/columns/types";
import { CellRenderer } from "~/_lib/grid/columns/cell_renderers";

export function dateStringColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "dateString",
    header: col.header,
    visible: col.visible,
  };
}

export const dateStringCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function DateStringCell({cell}) {
    const locale = useDateFnsLocale();
    const val = cell.getValue<string>();
    if (!val) return <></>;
    return <>{formatDateString(val, locale)}</>;
  };
