import React from 'react';
import { WhereOperator } from '@gen/request/v1/base_pb';
import type { CellRenderer } from '~/_lib/grid/columns/cell_renderers';
import type { CellFilterResolver } from '~/_lib/grid/columns/cell_filter_resolvers';
import type { ReduxStoreColumnDef } from '~/_lib/grid/columns/types';

type CustomersRow = {
  customerIds?: string[];
  customerLabels?: string;
};

export const customersCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function CustomersCell({ cell }) {
    const value = cell.getValue() as string | undefined;
    return <span>{value ?? ''}</span>;
  };

// Right-click on a Customers cell should filter by the customerIds array
// (the field actually exposed as the "Customers" quick filter), not by
// the denormalised customerLabels string. We only emit a usable filter
// when the row has exactly one customer — multi-customer cells are
// ambiguous without knowing which name the user targeted.
export const customersFilterResolver: CellFilterResolver = (row) => {
  const r = row as CustomersRow;
  if (!r?.customerIds || r.customerIds.length !== 1) return null;
  return {
    field: 'customerIds',
    value: r.customerIds[0],
    operator: WhereOperator.EQ,
    label: r.customerLabels ?? '',
  };
};
