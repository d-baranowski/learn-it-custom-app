import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'next-i18next';
import PureGrid from '~/_lib/grid/pure-grid';

import type { UpdateSessionPricesProps, PriceUpdateRow } from './types';
import { useSessionPriceUpdate } from './use_session_price_update';
import { usePriceUpdateColumns } from './use_price_update_columns';

export const UpdateSessionPrices: React.FC<UpdateSessionPricesProps> = (
  props
) => {
  const { therapyIds = [], defaultPrice, onCancel, afterSave } = props;
  const { t } = useTranslation();

  const {
    sessions,
    loading,
    confirming,
    hasFetched,
    fromDate,
    untilDate,
    excludedIds,
    newPrice,
    setNewPrice,
    selectedCount,
    gridData,
    doPreview,
    toggleExclude,
    handleConfirm,
    handleFromChange,
    handleUntilChange,
  } = useSessionPriceUpdate({
    therapyIds,
    defaultPrice,
    afterSave,
  });

  const columns = usePriceUpdateColumns({
    excludedIds,
    toggleExclude,
  });

  // Compute price mismatch warning count
  const priceMismatchCount = useMemo(() => {
    if (!newPrice || newPrice.trim() === '' || sessions.length === 0) return 0;
    return sessions.filter(
      (s) =>
        !excludedIds.has(s.id) &&
        s.therapyPrice != null &&
        s.therapyPrice !== newPrice.trim()
    ).length;
  }, [sessions, excludedIds, newPrice]);

  // PureGrid local state
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
    <Stack spacing={2} sx={{ pt: 1 }} data-testid="update-session-prices">
      {/* Date range + New Price + Preview button */}
      <Stack direction="row" spacing={2} alignItems="center">
        <DatePicker
          label={t('From')}
          value={fromDate}
          format="dd/MM/yyyy"
          onChange={handleFromChange}
          slotProps={{
            textField: {
              size: 'small',
              sx: { minWidth: 160 },
              inputProps: { 'data-testid': 'price-update-from-input' },
              InputProps: {
                endAdornment: fromDate ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear"
                      data-testid="price-update-from-clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFromChange(null);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            },
          }}
        />
        <DatePicker
          label={t('Until (optional)')}
          value={untilDate}
          format="dd/MM/yyyy"
          onChange={handleUntilChange}
          minDate={fromDate ?? undefined}
          slotProps={{
            textField: {
              size: 'small',
              sx: { minWidth: 160 },
              inputProps: { 'data-testid': 'price-update-until-input' },
            },
          }}
        />
        <TextField
          label={t('New Price')}
          size="small"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          sx={{ minWidth: 120 }}
          inputProps={{ 'data-testid': 'price-update-new-price-input' }}
          InputLabelProps={{ shrink: true }}
          type="number"
        />
        <Button
          variant="outlined"
          onClick={doPreview}
          disabled={therapyIds.length === 0}
          data-testid="price-update-preview-btn"
        >
          {t('Preview')}
        </Button>
      </Stack>

      {/* Summary / alerts */}
      {hasFetched && sessions.length === 0 && (
        <Typography data-testid="price-update-no-sessions-msg">
          {t('No sessions found for the selected criteria.')}
        </Typography>
      )}
      {hasFetched && sessions.length > 0 && (
        <Alert severity="info" data-testid="price-update-summary-text">
          {t('{{count}} session(s) found, {{selected}} selected for update.', {
            count: sessions.length,
            selected: selectedCount,
          })}
        </Alert>
      )}

      {/* Warning when new price differs from therapy configured price */}
      {hasFetched && priceMismatchCount > 0 && (
        <Alert severity="warning" data-testid="price-update-mismatch-warning">
          {t(
            '{{count}} session(s) have a therapy price that differs from the new price.',
            { count: priceMismatchCount }
          )}
        </Alert>
      )}

      {/* Preview table */}
      <Box sx={{ height: 400 }} data-testid="price-update-preview-table">
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
          }}
        />
      </Box>

      {/* Confirm / Cancel */}
      {hasFetched && sessions.length > 0 && (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} data-testid="price-update-cancel-btn">
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={confirming || selectedCount === 0 || !newPrice.trim()}
            data-testid="price-update-confirm-btn"
          >
            {confirming
              ? t('Processing...')
              : t('Update ({{count}})', { count: selectedCount })}
          </Button>
        </Stack>
      )}

      {/* Cancel only when no sessions */}
      {(!hasFetched || sessions.length === 0) && (
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} data-testid="price-update-cancel-btn">
            {t('Cancel')}
          </Button>
        </Stack>
      )}
    </Stack>
  );
};
