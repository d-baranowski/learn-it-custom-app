import {GridColumn} from "@gen/grids";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";
import {Avatar, Tooltip} from "@mui/material";

export function imageMultipleColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "imageMultiple",
    header: col.header,
    visible: col.visible,
    enableSorting: false
  };
}

export const imageMultipleCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function ImageMultipleCell({cell}) {
    const byteArrays = cell.getValue<string[]>();
    const firstByteArray = byteArrays[0];

    const firstBlob = new Blob([firstByteArray], { type: 'image/jpeg' });
    const firstImageUrl = URL.createObjectURL(firstBlob);

    let restAvatars;
    if (byteArrays.length <= 1) {
      restAvatars = "No Image";
    } else {
      restAvatars = byteArrays.map((byteArray, index) => {
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        return <Avatar key={index} variant="square" src={imageUrl} sx={{width: "120px", height: "120px", margin: "2px"}}/>;
      });
    }

    return (
      <Tooltip arrow title={<div>{restAvatars}</div>}>
        <Avatar variant="square" src={firstImageUrl} sx={{width: "80px", height: "80px"}}/>
      </Tooltip>
    );
  }

