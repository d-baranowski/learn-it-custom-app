import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import PureGrid from '~/_lib/grid/pure-grid';
import type { GridColumnDef } from '~/_lib/grid/types/column';

import type { SessionRow } from './types';

interface PreviewTableProps {
  columns: GridColumnDef<SessionRow>[];
  gridData: SessionRow[];
  loading: boolean;
  overrides: Record<string, unknown>;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({
  columns,
  gridData,
  loading,
  overrides,
}) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ desc: boolean; id: string }[]>([]);
  const [pagination, setPagination] = useState({ pageSize: 50, pageIndex: 0 });
  const emptyRowSelection: Record<string, boolean> = useMemo(() => ({}), []);

  const pagedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return gridData.slice(start, end);
  }, [gridData, pagination.pageIndex, pagination.pageSize]);

  return (
    <Box sx={{ height: 400 }} data-testid="session-generate-preview-table">
      <PureGrid
        columns={columns}
        data={pagedData}
        rowCount={gridData.length}
        isLoading={loading}
        rowSelection={emptyRowSelection}
        customHeightReduction={0}
        selectRow={() => {}}
        sorting={sorting}
        pagination={pagination}
        columnVisibility={columnVisibility}
        columnOrder={columnOrder}
        hasColumn={(id: string) => columnOrder.includes(id)}
        addColumn={(
          id: string,
          visible: boolean,
          position: string | null | undefined
        ) => {
          setColumnOrder((prev) => {
            if (prev.includes(id)) return prev;
            if (position === 'first') return [id, ...prev];
            if (position === 'last') return [...prev, id];
            return [...prev, id];
          });
          setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
        }}
        onColumnOrderChange={(updater) => {
          if (typeof updater === 'function') {
            setColumnOrder(updater(columnOrder));
          } else {
            setColumnOrder(updater);
          }
        }}
        onColumnVisibilityChange={(updater) => {
          if (typeof updater === 'function') {
            setColumnVisibility(updater(columnVisibility));
          } else {
            setColumnVisibility(updater);
          }
        }}
        onRowSelectionChange={() => {}}
        onSortingChange={(updater) => {
          if (typeof updater === 'function') {
            setSorting(updater(sorting));
          } else {
            setSorting(updater);
          }
        }}
        onPaginationChange={(updater) => {
          if (typeof updater === 'function') {
            setPagination(updater(pagination));
          } else {
            setPagination(updater);
          }
        }}
        options={{
          enableRowSelection: false,
          enableTopToolbar: true,
          enableBottomToolbar: true,
          enableColumnActions: true,
          enableColumnFilters: false,
          enablePagination: true,
          enableSorting: true,
          enableGlobalFilter: false,
          enableDensityToggle: false,
          getRowId: (row) => row._rowIdx,
          muiTableBodyRowProps: ({ row }) => {
            const session = row.original;
            const hasUnresolvedClash =
              session.hasRoomClash &&
              !(overrides as Record<string, { roomId?: string }>)[
                String(session._idx)
              ]?.roomId;
            const isDuplicate = session.alreadyExists;
            return {
              sx: {
                ...(hasUnresolvedClash && {
                  backgroundColor: 'warning.light',
                  opacity: 0.85,
                }),
                ...(isDuplicate && {
                  opacity: 0.45,
                }),
              },
            };
          },
        }}
      />
    </Box>
  );
};
