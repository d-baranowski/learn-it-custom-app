import {GridColumn} from "@gen/grids";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";
import {useTranslation} from "next-i18next";

export function hourMinutesColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "hourMinutes",
    header: col.header,
    visible: col.visible,
  };
}

export const hourminutesCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function HourMinutesCell({cell}) {
    const {t} = useTranslation()
    const val = cell.getValue<number>()
    const hours = Math.floor(val / 60);
    const minutes = val % 60
    return <>{hours} {t('hours')} {minutes} {t('minutes')}</>
  }
