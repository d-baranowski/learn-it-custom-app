import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import {useTranslation} from 'next-i18next';
import {GridColumn} from '@gen/grids';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {CellRenderer} from '~/_lib/grid/columns/cell_renderers';
import type {MRT_Cell} from 'material-react-table';

type SessionFrequencyEntryLike = {
  onDay?: number[];
  unit?: number;
};

type TherapyRowLike = {
  sessionFrequency?: SessionFrequencyEntryLike[];
};

const weekBaseDates = [
  new Date(Date.UTC(2024, 0, 1)),
  new Date(Date.UTC(2024, 0, 2)),
  new Date(Date.UTC(2024, 0, 3)),
  new Date(Date.UTC(2024, 0, 4)),
  new Date(Date.UTC(2024, 0, 5)),
  new Date(Date.UTC(2024, 0, 6)),
  new Date(Date.UTC(2024, 0, 7)),
];

function formatDay(day: number, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale || 'en', {
    weekday: 'short',
    timeZone: 'UTC',
  });

  return formatter.format(weekBaseDates[day - 1] ?? weekBaseDates[0]);
}

function formatDays(days: number[], locale: string): string {
  return days.map((day) => formatDay(day, locale)).join(', ');
}

function normalizedUnit(unit?: number): number {
  return unit === 2 ? 2 : 1;
}

function collectDaysByUnit(entries: SessionFrequencyEntryLike[] = []): Map<number, number[]> {
  const daysByUnit = new Map<number, Set<number>>();

  for (const entry of entries) {
    const unit = normalizedUnit(entry.unit);
    const currentDays = daysByUnit.get(unit) ?? new Set<number>();

    for (const day of entry.onDay ?? []) {
      if (day >= 1 && day <= 7) {
        currentDays.add(day);
      }
    }

    daysByUnit.set(unit, currentDays);
  }

  return new Map(
    Array.from(daysByUnit.entries()).map(([unit, days]) => [
      unit,
      Array.from(days).sort((left, right) => left - right),
    ])
  );
}

function TherapyDaysValue({cell}: {cell: MRT_Cell<any, unknown>}) {
  const {t, i18n} = useTranslation('common');
  const locale = i18n.language || 'en';
  const days = ((cell.getValue() as number[] | undefined) ?? []).slice().sort((left, right) => left - right);
  const row = cell.row.original as TherapyRowLike;
  const daysByUnit = collectDaysByUnit(row.sessionFrequency);
  const hasMixedUnits = daysByUnit.size > 1;

  if (days.length === 0) {
    return <span />;
  }

  const tooltipTitle = hasMixedUnits ? (
    <Stack spacing={0.5}>
      {Array.from(daysByUnit.entries()).map(([unit, unitDays]) => (
        <Typography key={unit} variant="body2">
          {unit === 2 ? t('Month') : t('Week')}: {formatDays(unitDays, locale)}
        </Typography>
      ))}
    </Stack>
  ) : null;

  return (
    <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5}}>
      <span>{formatDays(days, locale)}</span>
      {tooltipTitle ? (
        <Tooltip arrow title={tooltipTitle}>
          <InfoOutlinedIcon sx={{fontSize: 16, color: 'text.secondary'}} />
        </Tooltip>
      ) : null}
    </Box>
  );
}

export function therapyDaysColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'therapyDays',
    header: col.header,
    visible: col.visible,
    type: col.type,
    enableSorting: col.enableSorting,
  };
}

export const therapyDaysCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function TherapyDaysCell({cell}) {
    return <TherapyDaysValue cell={cell} />;
  };