import {GridColumn} from '@gen/grids';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {CellRenderer} from '~/_lib/grid/columns/cell_renderers';
import React from 'react';

const MECHANISM_EMAIL = 1;
const MECHANISM_SMS = 2;

export function notificationRecipientColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'notificationRecipient',
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}

export const notificationRecipientCell: (col: ReduxStoreColumnDef) => CellRenderer = () => {
  return function NotificationRecipientCell({cell}) {
    const row = cell.row.original as {
      recipientLabel?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      deliveryMechanism?: number;
    };
    const label = row.recipientLabel?.trim();
    if (label) {
      return <span>{label}</span>;
    }
    const contact =
      row.deliveryMechanism === MECHANISM_EMAIL
        ? row.recipientEmail
        : row.deliveryMechanism === MECHANISM_SMS
          ? row.recipientPhone
          : row.recipientEmail || row.recipientPhone;
    return <span>{contact ?? ''}</span>;
  };
};
