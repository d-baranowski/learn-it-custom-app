import React, { useMemo } from 'react';
import { Checkbox, Chip } from '@mui/material';
import { useTranslation } from 'next-i18next';
import type { GridColumnDef } from '~/_lib/grid/types/column';
import { parseTranslatedLabel } from '~/sections/core/therapy/session-generate/utils';

import type { PriceUpdateRow } from './types';

interface UsePriceUpdateColumnsArgs {
  excludedIds: Set<string>;
  toggleExclude: (sessionId: string) => void;
}

export function usePriceUpdateColumns({
  excludedIds,
  toggleExclude,
}: UsePriceUpdateColumnsArgs) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const columns = useMemo<GridColumnDef<PriceUpdateRow>[]>(() => {
    const cols: GridColumnDef<PriceUpdateRow>[] = [];

    // Exclude checkbox column
    cols.push({
      id: 'exclude',
      accessorFn: (row) => (excludedIds.has(row.id) ? 1 : 0),
      header: t('Exclude'),
      size: 80,
      enableSorting: false,
      Cell: ({ row }) => {
        const session = row.original;
        const isExcluded = excludedIds.has(session.id);
        return (
          <Checkbox
            size="small"
            checked={isExcluded}
            onChange={() => toggleExclude(session.id)}
            data-testid={`price-update-exclude-${session.id}`}
          />
        );
      },
    });

    cols.push(
      {
        id: 'date',
        accessorFn: (row) => row.date,
        header: t('Date'),
        size: 120,
        enableSorting: true,
      },
      {
        id: 'time',
        accessorFn: (row) => `${row.startTime} - ${row.endTime}`,
        header: t('Time'),
        size: 140,
        enableSorting: true,
      },
      {
        id: 'therapy',
        accessorFn: (row) => row.therapyLabel ?? '',
        header: t('Therapy'),
        size: 200,
        enableSorting: true,
      },
      {
        id: 'therapist',
        accessorFn: (row) => row.therapistLabel ?? '',
        header: t('Therapist'),
        size: 160,
        enableSorting: true,
      },
      {
        id: 'location',
        accessorFn: (row) =>
          row.isOnline
            ? t('Online')
            : parseTranslatedLabel(row.roomLabel, locale),
        header: t('Room / Online'),
        size: 160,
        enableSorting: true,
        Cell: ({ row }) => {
          const session = row.original;
          if (session.isOnline) {
            return <Chip label={t('Online')} color="info" size="small" />;
          }
          return <>{parseTranslatedLabel(session.roomLabel, locale)}</>;
        },
      },
      {
        id: 'currentPrice',
        accessorFn: (row) => row.price,
        header: t('Current Price'),
        size: 120,
        enableSorting: true,
      }
    );

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, locale, excludedIds, toggleExclude]);

  return columns;
}
