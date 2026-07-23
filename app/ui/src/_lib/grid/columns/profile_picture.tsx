import {GridColumn} from "@gen/grids";
import React from "react";
import {ReduxStoreColumnDef} from "~/_lib/grid/columns/types";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";
import {Avatar, Box} from "@mui/material";

const PROFILE_PICTURE_SIZE = "80px";

export function profilePictureColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: "profilePicture",
    header: col.header,
    visible: col.visible,
    enableSorting: false
  };
}

export const profilePictureCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function ProfilePictureCell({cell}) {
    const imageSource = cell.getValue<string>();
    if (!imageSource) {
      return null;
    }
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: "100%", height: "100%", paddingY: 0.5}}>
        <Avatar
          src={imageSource ?? undefined}
          alt="Therapist profile picture"
          sx={{width: PROFILE_PICTURE_SIZE, height: PROFILE_PICTURE_SIZE}}
        />
      </Box>
    );
  }
