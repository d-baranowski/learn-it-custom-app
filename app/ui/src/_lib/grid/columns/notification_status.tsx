import {GridColumn} from '@gen/grids';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {CellRenderer} from '~/_lib/grid/columns/cell_renderers';
import {useEnumDisplay} from '~/components/enum';
import {IconButton, Stack, Tooltip} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {useTranslation} from 'next-i18next';
import React from 'react';

const FINAL_DELIVERY_STATES = new Set([1, 2, 3, 4, 5]);

export function notificationStatusColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'notificationStatus',
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}

export const notificationStatusCell: (col: ReduxStoreColumnDef) => CellRenderer = () => {
  return function NotificationStatusCell({cell}) {
    const {t} = useTranslation('common');
    const row = cell.row.original as {
      status?: number;
      deliveryStatus?: number;
      errorMessage?: string;
      deliveryFailureReason?: string;
    };
    const useDelivery =
      row.deliveryStatus !== undefined && FINAL_DELIVERY_STATES.has(row.deliveryStatus);
    const deliveryLabel = useEnumDisplay('NotificationDeliveryStatus', row.deliveryStatus ?? 0);
    const outboxLabel = useEnumDisplay('NotificationStatus', row.status ?? 0);
    const label = useDelivery ? deliveryLabel : outboxLabel;

    const errorText = row.deliveryFailureReason?.trim() || row.errorMessage?.trim() || '';
    if (!errorText) {
      return <span>{label}</span>;
    }

    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      void navigator.clipboard.writeText(errorText);
    };

    const copyLabel = t('Copy error details');
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <span>{label}</span>
        <Tooltip title={copyLabel} arrow>
          <IconButton size="small" onClick={handleCopy} aria-label={copyLabel}>
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };
};
