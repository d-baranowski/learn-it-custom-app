import { GridColumn } from '@gen/grids';
import React from 'react';
import { ReduxStoreColumnDef } from '~/_lib/grid/columns/types';
import { CellRenderer } from '~/_lib/grid/columns/cell_renderers';
import { Box } from '@mui/material';

export function colorColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    type: col.type,
    cellRendererType: 'color',
    header: col.header,
    visible: col.visible,
    enableSorting: true,
  };
}

export const colorCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function ColorCell({ cell }) {
    const colorValue = cell.getValue<string>();

    if (!colorValue) {
      return <span>-</span>;
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '4px',
            backgroundColor: colorValue,
            border: '1px solid rgba(0, 0, 0, 0.23)',
          }}
        />
      </Box>
    );
  };
