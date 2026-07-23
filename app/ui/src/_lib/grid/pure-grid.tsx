// This intends to be a pure component with no dependencies on external data stores.
// It only accepts props and is not dependent on hooks or contexts
// Mapping between actions and store will be handled in another component
import {
  MaterialReactTable,
  MRT_ColumnOrderState,
  MRT_PaginationState,
  MRT_RowData,
  MRT_RowSelectionState,
  MRT_SelectCheckbox,
  MRT_SortingState,
  type MRT_TableInstance,
  MRT_TableOptions,
  MRT_Updater,
  MRT_VisibilityState,
  useMaterialReactTable
} from 'material-react-table';
import IconButton from '@mui/material/IconButton';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import React, { ReactNode } from 'react';
import ContextMenu, { ContextMenuItems, Items } from '~/components/context-menu/context-menu';
import { useContextMenu } from '~/components/context-menu/use-context-menu';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TableRowsIcon from '@mui/icons-material/TableRows';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { WhereOperator } from '@gen/request/v1/base_pb';
import cell_filter_resolvers from '~/_lib/grid/columns/cell_filter_resolvers';
import type { CellRendererName } from '~/_lib/grid/columns/cell_renderers';
import { toast } from 'react-hot-toast';
import type { TableContainerProps } from '@mui/material/TableContainer';
import type { GridColumnDef } from '~/_lib/grid/types/column';
import merge from 'lodash/merge';
import Box from '@mui/material/Box';
import { WithDebugRenderCountProps } from '~/_lib/grid/util/with-debug-render-count';
import { isEqual } from 'lodash';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import { MRT_Localization_VI } from 'material-react-table/locales/vi';
import { useTranslation } from 'next-i18next';
import {
  OPTIMISTIC_PENDING_FIELD,
  OPTIMISTIC_ID_PREFIX,
} from '~/_lib/forms/optimistic/optimistic-list';
import { GridSettingsContext } from '~/_lib/grid/context/grid-settings-context';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import Divider from '@mui/material/Divider';

const RECENT_CREATED_WINDOW_MS = 60 * 1000;

type GridOptions<T extends Record<string, any>> = Omit<
  MRT_TableOptions<T>,
  'columns' | 'data' | 'rowCount' | 'state'
>;

interface BackgroundOption {
  columnName: string;
  color: string;
  compareValue: any;
}

export interface GridContextMenuData<T extends Record<string, any>> {
  row: T;
  columnId: string | null;
  cellText: string;
  rowText: string;
}

export type GridContextMenuItems<T extends Record<string, any>> =
  | ContextMenuItems<GridContextMenuData<T>>
  | ((
      data?: GridContextMenuData<T>
    ) => ContextMenuItems<GridContextMenuData<T>>);

interface GridProps<T extends Record<string, any>> {
  columns: GridColumnDef<T>[];
  contextMenuItems?: GridContextMenuItems<T>;
  onClickRow?: (row: T) => void;
  onDoubleClickRow?: (row: T) => void;
  options?: GridOptions<T>;

  onFilterCell?: (filterField: string, value: unknown, operator: WhereOperator) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;

  enableTopToolbar?: boolean;
  renderTopToolbarCustomActions?: (props: {
    table: MRT_TableInstance<T>;
  }) => ReactNode;
  renderToolbarInternalActions?: (props: {
    table: MRT_TableInstance<T>;
  }) => ReactNode;

  rowCount: number;

  hasColumn: (id: string) => boolean;
  addColumn: (
    id: string,
    visible: boolean,
    position: string | null | undefined,
  ) => void;

  rowSelection: Record<string, boolean>;
  selectRow: (id: string, multi?: boolean) => void;

  sorting: { desc: boolean; id: string }[];
  pagination: { pageSize: number; pageIndex: number };

  isLoading: boolean;
  recentRowId?: string;
  customHeightReduction?: number;

  /**
   * Maps the column id to boolean
   */
  columnVisibility: Record<string, boolean>;
  /**
   * Ordered array of colum ids
   */
  columnOrder: string[];

  data: T[];

  backgroundOptions?: BackgroundOption[];
  statusCellNumber?: number;

  onOpenColumnManager?: () => void;
  onColumnOrderChange: (updater: MRT_Updater<MRT_ColumnOrderState>) => void;
  onColumnVisibilityChange: (updater: MRT_Updater<MRT_VisibilityState>) => void;
  onRowSelectionChange: (updater: MRT_Updater<MRT_RowSelectionState>) => void;
  onSortingChange: (updater: MRT_Updater<MRT_SortingState>) => void;
  onPaginationChange: (updater: MRT_Updater<MRT_PaginationState>) => void;
}

const statusStyles: Record<
  string,
  { backgroundColor: string; color: string; border: string }
> = {
  '0': {
    // Pending
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    color: '#d6a204',
    border: '1px solid #d6a204',
  },
  '1': {
    // Approved
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4CAF50',
    border: '1px solid #4CAF50',
  },
  '2': {
    // Denied
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#F44336',
    border: '1px solid #F44336',
  },
};

const getStatusLabel = (value: number): string => {
  switch (value) {
    case 0:
      return 'Pending';
    case 1:
      return 'Approved';
    case 2:
      return 'Denied';
    default:
      return '';
  }
};

function PureGrid<T extends Record<string, any>>(props: GridProps<T>) {
  const {
    columns,
    contextMenuItems,
    onClickRow,
    onDoubleClickRow,
    options,
    hasColumn,
    addColumn,
  } = props;

  const theme = useTheme();
  const { t, i18n } = useTranslation('common');
  const settings = React.useContext(GridSettingsContext);
  const isFetching = settings?.isFetching ?? false;
  const recentRowId = props.recentRowId;
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu<
    GridContextMenuData<T>
  >(-2, -4);

  const filterableTypes = React.useMemo(
    () =>
      new Set([
        'string',
        'bigint',
        'number',
        'date',
        'dateString',
        'dateTime',
        'boolean',
      ]),
    []
  );

  const filterMenuItems = React.useMemo<
    ContextMenuItems<GridContextMenuData<T>>
  >(() => {
    const data = contextMenu.data;
    const items: ContextMenuItems<GridContextMenuData<T>> = [];

    if (data && data.columnId && props.onFilterCell) {
      const col = columns.find((c) => c.id === data.columnId) as
        | (GridColumnDef<T> & {
            filterField?: string;
            type?: string;
            cellRendererType?: CellRendererName;
          })
        | undefined;

      const resolver = col?.cellRendererType
        ? cell_filter_resolvers[col.cellRendererType]
        : undefined;
      const resolved = resolver ? resolver(data.row) : null;

      const filterField = resolved?.field ?? col?.filterField;
      const filterValue =
        resolved?.value ??
        (filterField === col?.id
          ? (data.row as Record<string, unknown>)[filterField!]
          : (data.row as Record<string, unknown>)[filterField!]);

      const operator = resolved?.operator ?? WhereOperator.EQ;
      const colType = col?.type;
      const isFilterable =
        !!filterField &&
        // Resolver-supplied predicates bypass the column-type allowlist —
        // the resolver knows what it's filtering by.
        (!!resolved || (!!colType && filterableTypes.has(colType))) &&
        !col?.id?.toString().startsWith('mrt-');

      if (isFilterable) {
        const hasValue =
          filterValue !== undefined && filterValue !== null && filterValue !== '';
        if (hasValue) {
          const display = resolved
            ? t(resolved.label)
            : data.cellText || String(filterValue);
          const menuLabel = resolved
            ? t('Filter by {{value}}', { value: display })
            : t('Filter by {{header}}: {{value}}', {
                header: col!.header as string,
                value: display,
              });
          items.push({
            testId: 'context-menu-filter-by',
            label: menuLabel,
            icon: <FilterAltIcon fontSize="small" />,
            onClick: () => {
              props.onFilterCell?.(filterField!, filterValue, operator);
            },
          });
        }
      }
    }

    if (props.onClearFilters && props.hasActiveFilters) {
      items.push({
        testId: 'context-menu-clear-filters',
        label: t('Clear filters'),
        icon: <FilterAltOffIcon fontSize="small" />,
        onClick: () => props.onClearFilters?.(),
      });
    }

    return items;
  }, [
    contextMenu.data,
    columns,
    filterableTypes,
    props.onFilterCell,
    props.onClearFilters,
    props.hasActiveFilters,
    t,
  ]);

  const defaultMenuItems = React.useMemo<
    ContextMenuItems<GridContextMenuData<T>>
  >(
    () => [
      ...filterMenuItems,
      {
        label: t('Copy Cell'),
        icon: <ContentCopyIcon fontSize="small" />,
        onClick: (data) => {
          if (!data) return;
          navigator.clipboard.writeText(data.cellText);
          toast.success(t('Copied!'));
        },
      },
      {
        label: t('Copy Row'),
        icon: <TableRowsIcon fontSize="small" />,
        onClick: (data) => {
          if (!data) return;
          navigator.clipboard.writeText(data.rowText);
          toast.success(t('Copied!'));
        },
      },
    ],
    [t, filterMenuItems],
  );

  const externalMenuItems = React.useMemo<
    ContextMenuItems<GridContextMenuData<T>>
  >(() => {
    if (!contextMenuItems) return [];
    return typeof contextMenuItems === 'function'
      ? contextMenuItems(contextMenu.data)
      : contextMenuItems;
  }, [contextMenuItems, contextMenu.data]);

  const mergedMenuItems = React.useMemo<
    ContextMenuItems<GridContextMenuData<T>>
  >(() => {
    if (externalMenuItems.length === 0) return defaultMenuItems;
    return [...externalMenuItems, Items.DIVIDER, ...defaultMenuItems];
  }, [defaultMenuItems, externalMenuItems]);

  const mrtLocalization = React.useMemo(() => {
    switch (i18n.language) {
      case 'pl':
        return MRT_Localization_PL;
      case 'vi':
        return MRT_Localization_VI;
      default:
        return undefined;
    }
  }, [i18n.language]);

  // add internal grid columns if not present when opts set
  React.useEffect(() => {
    if (options?.enableExpanding) {
      if (!options.positionExpandColumn) {
        options.positionExpandColumn = 'first';
      }

      if (!hasColumn('mrt-row-expand')) {
        addColumn('mrt-row-expand', true, options.positionExpandColumn);
      }
    }

    if (options?.enableRowActions) {
      if (!options.positionActionsColumn) {
        options.positionActionsColumn = 'last';
      }

      if (!hasColumn('mrt-row-actions')) {
        addColumn('mrt-row-actions', true, options.positionActionsColumn);
      }
    }

    if (options?.enableRowSelection) {
      if (!hasColumn('mrt-row-select')) {
        addColumn('mrt-row-select', true, 'first');
      }
    }
  }, [options, hasColumn, addColumn]);

  // default options
  const defaultOpts: MRT_TableOptions<T> = {
    columns,

    data: props.data,
    defaultColumn: {
      enableColumnFilterModes: false,
      enableColumnFilter: false,
      sortDescFirst: false,
    },
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableRowActions: options?.renderRowActionMenuItems !== undefined,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    displayColumnDefOptions: {
      'mrt-row-select': {
        size: 80,
        minSize: 80,
        grow: false,
        Cell: ({row, table}) => (
          <>
            <MRT_SelectCheckbox row={row} table={table} />
            {props.onDoubleClickRow && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onDoubleClickRow!(row.original);
                }}
                data-testid="grid-row-open"
                sx={{p: 0.25}}
              >
                <LaunchOutlinedIcon sx={{fontSize: 16}} />
              </IconButton>
            )}
          </>
        ),
      },
    },
    enableStickyHeader: true,
    enablePagination: true,
    getRowId: (row: T) => row.id,
    initialState: {
      density: 'compact',
      showAlertBanner: false,
      showGlobalFilter: false,
      showProgressBars: false,
      columnVisibility: props.columnVisibility,
    },
    muiExpandAllButtonProps: {
      sx: {},
    },
    muiLinearProgressProps: ({ isTopToolbar }) => ({
      sx: isTopToolbar ? undefined : { display: 'none' },
    }),
    layoutMode: 'grid',
    manualPagination: true,
    manualSorting: true,

    muiTableBodyCellProps: ({ cell, row }) => {
      const cellValue = cell.getValue();
      const columnIndex = cell.column.getIndex();

      const original = row.original as Record<string, unknown> | null;
      const isOptimisticPending =
        !!(original && original[OPTIMISTIC_PENDING_FIELD]) ||
        (typeof row.id === 'string' && row.id.startsWith(OPTIMISTIC_ID_PREFIX));

      const cellContextMenuHandler = (e: React.MouseEvent) => {
        if (isOptimisticPending) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const tdEl = (e.target as HTMLElement).closest('td');
        const trEl = tdEl?.closest('tr');
        const cellText = String(cell.getValue() ?? (tdEl?.textContent ?? '')).trim();
        const rowText = trEl
          ? Array.from(trEl.querySelectorAll('td'))
              .map((td) => (td.textContent ?? '').trim())
              .filter((s) => s.length > 0)
              .join('\t')
          : '';
        openContextMenu(e, {
          row: row.original,
          columnId: cell.column.id,
          cellText,
          rowText,
        });
      };

      const isStatusCell =
        props.statusCellNumber !== undefined &&
        Number(columnIndex) === props.statusCellNumber;

      if (isStatusCell && cellValue !== undefined) {
        const numericStatus = String(cellValue);
        const statusStyle = statusStyles[numericStatus] || {};
        const statusLabel = getStatusLabel(Number(cellValue));

        return {
          onContextMenu: cellContextMenuHandler,
          sx: {
            padding: '8px',
            '& .MuiTableCell-root': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            '& span': {
              display: 'inline-block',
              borderRadius: '16px',
              padding: '4px',
              backgroundColor: statusStyle.backgroundColor,
              color: statusStyle.color,
              border: statusStyle.border,
              fontSize: '0.875rem',
              fontWeight: 500,
              minWidth: '80px',
              textAlign: 'center',
            },
          },
          children: <span>{statusLabel}</span>,
        };
      }

      const matchingOption = props.backgroundOptions?.find(
        (option) =>
          cell.column.id === option.columnName &&
          cellValue === option.compareValue,
      );

      return {
        onContextMenu: cellContextMenuHandler,
        sx: {
          padding: '2px',
          paddingLeft: '8px',
          ...(matchingOption ? { backgroundColor: matchingOption.color } : {}),
        },
      };
    },

    muiTableBodyRowProps: ({ row, table }) => {
      // Optimistic Create rows: while the API call is in flight the row
      // exists in the cache with a synthetic id and a `__optimisticPending`
      // flag. We render it greyed out and ignore click / dblclick so the
      // user can't open a form for an entity the backend doesn't know about
      // yet. The flag clears when the mutation resolves and the temp row is
      // replaced by the real saved entity.
      const original = row.original as Record<string, unknown> | null;
      const isOptimisticPending =
        !!(original && original[OPTIMISTIC_PENDING_FIELD]) ||
        (typeof row.id === 'string' && row.id.startsWith(OPTIMISTIC_ID_PREFIX));
      const isCancelled = !!(original && original.cancelledAt);
      const createdRaw = Number(original?.createdAt ?? 0);
      const createdMs =
        createdRaw > 0 ? (createdRaw < 1e12 ? createdRaw * 1000 : createdRaw) : 0;
      const isRecentlyCreated =
        createdMs > 0 && Date.now() - createdMs < RECENT_CREATED_WINDOW_MS;
      return {
        // Expose the row's domain ID on the DOM element so E2E tests can
        // identify rows precisely (without relying on visible cell content).
        'data-id': row.id,
        ...(isOptimisticPending
          ? { 'data-optimistic-pending': 'true' as const }
          : {}),
        ...(isCancelled ? { 'data-cancelled': 'true' as const } : {}),
        onClick: () => {
          if (isOptimisticPending) return;
          props.selectRow(
            row.id,
            (options?.enableMultiRowSelection as boolean) ?? false,
          );

          if (onClickRow) {
            onClickRow(row.original);
          }
        },
        onContextMenu: (e) => {
          if (isOptimisticPending) {
            e.preventDefault();
            return;
          }
          e.preventDefault();
          const tdEl = (e.target as HTMLElement).closest('td');
          const trEl = tdEl?.closest('tr');
          const cellText = (tdEl?.textContent ?? '').trim();
          const rowText = trEl
            ? Array.from(trEl.querySelectorAll('td'))
                .map((td) => (td.textContent ?? '').trim())
                .filter((s) => s.length > 0)
                .join('\t')
            : '';
          openContextMenu(e, {
            row: row.original,
            columnId: null,
            cellText,
            rowText,
          });
        },
        onDoubleClick: () => {
          if (isOptimisticPending) return;
          props.selectRow(
            row.id,
            (options?.enableMultiRowSelection as boolean) ?? false,
          );

          if (props.onDoubleClickRow) {
            props.onDoubleClickRow(row.original);
          }
        },
        selected: props.rowSelection[row.id],
        sx: {
          backgroundColor: isRecentlyCreated
            ? alpha(theme.palette.success.main, 0.08)
            : recentRowId === row.id
              ? alpha(theme.palette.primary.main, 0.08)
              : undefined,
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: (isRecentlyCreated
              ? alpha(theme.palette.success.main, 0.08)
              : recentRowId === row.id
                ? alpha(theme.palette.primary.main, 0.08)
                : 'transparent') + ' !important',
          },
          '&.Mui-selected:not(:hover) td::after': {
            background: 'transparent',
            backgroundColor: 'transparent',
          },
          '&:hover td::after, &.Mui-selected:hover td::after': {
            backgroundColor: theme.palette.action.hover,
          },
          boxShadow: isRecentlyCreated
            ? `inset 3px 0 0 ${theme.palette.success.main}`
            : recentRowId === row.id
              ? `inset 3px 0 0 ${theme.palette.primary.main}`
              : undefined,
          opacity: isOptimisticPending
            ? 0.55
            : isCancelled
              ? 0.5
              : row.original.disabled
                ? 0.5
                : undefined,
          textDecoration: isCancelled ? 'line-through' : undefined,
          cursor: isOptimisticPending ? 'progress' : undefined,
          // Animated stripe overlay so users see "saving in progress" as a
          // clear UI signal — not just a faded row.
          ...(isOptimisticPending
            ? {
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    'repeating-linear-gradient(45deg, transparent 0 10px, rgba(0,0,0,0.06) 10px 20px)',
                  backgroundSize: '28px 28px',
                  animation: 'optimistic-row-stripes 1.2s linear infinite',
                  pointerEvents: 'none',
                },
                '@keyframes optimistic-row-stripes': {
                  '0%': { backgroundPosition: '0 0' },
                  '100%': { backgroundPosition: '28px 0' },
                },
              }
            : {}),
        },
      };
    },

    muiTableContainerProps: ({ table }) => defaultMuiTableContainerProps(table),

    muiTablePaperProps: {
      sx: {
        height: 'calc(100%)',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        '&:first-of-type .Mui-TableHeadCell-Content': {
          height: '100%',
          marginTop: '-3.3px',
        },
      },
    },

    onColumnOrderChange: (updater) => {
      props.onColumnOrderChange(updater);
    },

    onColumnVisibilityChange: (updater) => {
      props.onColumnVisibilityChange(updater);
    },

    onRowSelectionChange: (updater) => {
      props.onRowSelectionChange(updater);
    },

    onSortingChange: (updater) => {
      // console.log("PURE GRID DEBUG: On sorting change")
      props.onSortingChange(updater);
    },

    onPaginationChange: (updater) => {
      props.onPaginationChange(updater);
    },

    positionActionsColumn: 'last',
    positionExpandColumn: 'first',
    positionToolbarAlertBanner: 'bottom',
    enableTopToolbar: props.enableTopToolbar,
    renderTopToolbarCustomActions: props.renderTopToolbarCustomActions,
    renderToolbarInternalActions: props.renderToolbarInternalActions,

    renderColumnActionsMenuItems: ({ closeMenu, internalColumnMenuItems }) => [
      ...internalColumnMenuItems,
      ...(props.onOpenColumnManager ? [
        <Divider key="manage-columns-divider" />,
        <MenuItem
          key="manage-columns"
          onClick={() => {
            closeMenu();
            props.onOpenColumnManager!();
          }}
        >
          <ListItemIcon><ViewColumnOutlinedIcon /></ListItemIcon>
          <ListItemText>{t('Manage columns')}</ListItemText>
        </MenuItem>,
      ] : []),
    ],

    rowCount: props.rowCount,

    state: {
      columnOrder: enforceDisplayColumnPositions(
        props.columnOrder,
        options?.enableRowSelection !== false,
        options?.renderRowActionMenuItems !== undefined,
        !!options?.enableExpanding,
      ),
      columnVisibility: props.columnVisibility,
      isLoading: props.isLoading,
      pagination: props.pagination,
      rowSelection: props.rowSelection,
      showSkeletons: props.isLoading,
      showProgressBars: isFetching && !props.isLoading,
      sorting: props.sorting,
    },
  };

  // merge default options with user options if set
  const gridOptions = merge(defaultOpts, options || {});
  function defaultMuiTableContainerProps<T extends MRT_RowData>(
    table: MRT_TableInstance<T>,
  ): TableContainerProps {
    const tbh = table.refs.topToolbarRef.current?.offsetHeight || 0;
    const bbh = table.refs.bottomToolbarRef.current?.offsetHeight || 0;
    let reduction = tbh + bbh + 70;
    if (props.customHeightReduction !== undefined) {
      // console.log('Skipping height adjustment');
      reduction = props.customHeightReduction;
    }

    return {
      sx: {
        maxHeight: `calc(100% - ${reduction}px)`,
        height: `calc(100% - ${reduction}px)`,
      },
    };
  }

  const table = useMaterialReactTable({
    ...gridOptions,
    localization: mrtLocalization,
    enableRowSelection: gridOptions.enableRowSelection,
    muiTableContainerProps: ({ table }) => defaultMuiTableContainerProps(table),
    renderEmptyRowsFallback: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, width: '100%', color: 'text.secondary', fontStyle: 'italic' }}>
        {mrtLocalization?.noRecordsToDisplay ?? 'No records to display'}
      </Box>
    ),
  });

  return (
    <Box sx={{ height: '100%' }} data-testid={'pure-rpg-grid-container'}>
      <MaterialReactTable table={table} />
      <ContextMenu
        contextMenu={contextMenu}
        handleClose={closeContextMenu}
        menuItems={mergedMenuItems}
      />
    </Box>
  );
}

/**
 * Force MRT's display columns to their canonical positions regardless of
 * what's in the persisted column order — selection/expand always come first,
 * row actions always come last. Without this, switching to a saved view
 * captured before these display columns existed leaves them appended to the
 * end by MRT's fallback (UTR-000159).
 */
function enforceDisplayColumnPositions(
  order: string[],
  rowSelectionEnabled: boolean,
  rowActionsEnabled: boolean,
  expandingEnabled: boolean,
): string[] {
  const userCols = order.filter(c => !c.startsWith('mrt-'));
  const front: string[] = [];
  if (expandingEnabled) front.push('mrt-row-expand');
  if (rowSelectionEnabled) front.push('mrt-row-select');
  const back: string[] = [];
  if (rowActionsEnabled) back.push('mrt-row-actions');
  return [...front, ...userCols, ...back];
}

const MemoizedPureGrid = React.memo(PureGrid, (prevProps, nextProps) => {
  // console.log("Pure Grid Memoization Function", prevProps, nextProps)

  if (!isEqual(prevProps.columnOrder, nextProps.columnOrder)) {
    // console.log('DEBUG: Grid render column order changed');
    return false;
  }

  if (!isEqual(prevProps.columnVisibility, nextProps.columnVisibility)) {
    // console.log('DEBUG: Grid render column visibility changed');
    return false;
  }

  if (
    !isEqual(
      prevProps.onColumnVisibilityChange,
      nextProps.onColumnVisibilityChange,
    )
  ) {
    // console.log('DEBUG: Grid render onColumnVisibilityChange changed');
    return false;
  }

  if (!isEqual(prevProps.isLoading, nextProps.isLoading)) {
    // console.log('DEBUG: Grid render isLoading changed');
    return false;
  }

  if (!isEqual(prevProps.pagination, nextProps.pagination)) {
    // console.log('DEBUG: Grid render pagination changed');
    return false;
  }

  if (!isEqual(prevProps.onPaginationChange, nextProps.onPaginationChange)) {
    // console.log('DEBUG: Grid render paginationChange changed');
    return false;
  }

  if (!isEqual(prevProps.rowSelection, nextProps.rowSelection)) {
    // console.log('DEBUG: Grid render rowSelection changed');
    return false;
  }

  if (
    !isEqual(prevProps.onRowSelectionChange, nextProps.onRowSelectionChange)
  ) {
    // console.log('DEBUG: Grid render onRowSelectionChange changed');
    return false;
  }

  if (!isEqual(prevProps.sorting, nextProps.sorting)) {
    // console.log('DEBUG: Grid render sorting changed');
    return false;
  }

  if (!isEqual(prevProps.onSortingChange, nextProps.onSortingChange)) {
    // console.log('DEBUG: Grid render onSortingChange changed');
    return false;
  }

  if (prevProps.data !== nextProps.data) {
    // Data array reference inequality is enough — TanStack Query and our
    // optimistic-rows merge always produce a new items array reference when
    // anything changes. A deep `isEqual` on proto Message rows is both
    // expensive AND unreliable: certain Message implementations have
    // non-enumerable / circular fields that can collapse a real change
    // (like an inserted optimistic temp row) into "equal", which hides the
    // update from the grid.
    return false;
  }

  if (!isEqual(prevProps.rowCount, nextProps.rowCount)) {
    // console.log('DEBUG: Grid render rowCount changed');
    return false;
  }

  if (!isEqual(prevProps.pagination, nextProps.pagination)) {
    // console.log('DEBUG: Grid render pagination changed');
    return false;
  }

  if (
    !isEqual(prevProps.customHeightReduction, nextProps.customHeightReduction)
  ) {
    // console.log('DEBUG: Grid render customHeightReduction changed');
    return false;
  }

  // Warning ensure to implement necessary checks here when changing the component
  return true;
}) as <T extends object>(
  props: GridProps<T> & WithDebugRenderCountProps,
) => React.ReactElement;

export default MemoizedPureGrid;

export type PureGridType<T extends Record<string, any>> = typeof PureGrid<T>
