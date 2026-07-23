import {GridColumn} from "@gen/grids";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";
import {Avatar} from "@mui/material";

export function imageColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "image",
    header: col.header,
    visible: col.visible,
    enableSorting: false
  };
}

export const imageCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function ImageCell({cell}) {
    return <Avatar variant="square" src={cell.getValue<string>()} sx={{width: "80px", height: "80px"}}/>;
  }
