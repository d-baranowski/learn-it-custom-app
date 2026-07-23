import React, { useMemo } from 'react';
import {
  Autocomplete,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@connectrpc/connect-query';
import { autocomplete as roomAutocomplete } from '@gen/core/v1/room-RoomService_connectquery';
import { AutocompleteRequest } from '@gen/request/v1/base_pb';
import { DefaultAutocompleteOrder } from '~/components/form/elements/types';
import { IAutocompleteItem } from '@gen/interface';
import type { GridColumnDef } from '~/_lib/grid/types/column';

import type { SessionRow, PreviewMode, OverrideState } from './types';
import { parseTranslatedLabel, formatDateTime, getDayOfWeek } from './utils';

interface UsePreviewColumnsArgs {
  mode: PreviewMode;
  overrides: Record<string, OverrideState>;
  excludedIndices: Set<number>;
  toggleExclude: (idx: number) => void;
  getEffectiveDate: (idx: number, session: SessionRow) => string;
  getEffectiveStartTime: (idx: number, session: SessionRow) => string;
  getEffectiveEndTime: (idx: number, session: SessionRow) => string;
  getEffectiveRoomId: (idx: number, session: SessionRow) => string | undefined;
  getEffectiveOnline: (idx: number, session: SessionRow) => boolean;
  setOverrideField: (
    idx: number,
    field: keyof OverrideState,
    value: string | boolean | undefined
  ) => void;
}

export function usePreviewColumns({
  mode,
  overrides,
  excludedIndices,
  toggleExclude,
  getEffectiveDate,
  getEffectiveStartTime,
  getEffectiveEndTime,
  getEffectiveRoomId,
  getEffectiveOnline,
  setOverrideField,
}: UsePreviewColumnsArgs) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';

  // Room autocomplete data
  const roomRequest = useMemo(
    () => new AutocompleteRequest({ order: DefaultAutocompleteOrder }),
    []
  );
  const {
    data: roomData,
    isLoading: roomsLoading,
    refetch: refetchRooms,
  } = useQuery(roomAutocomplete, roomRequest);
  const roomOptions: IAutocompleteItem[] = useMemo(
    () => roomData?.items?.map((o) => ({ ID: o.ID, label: o.label })) ?? [],
    [roomData]
  );

  const columns = useMemo<GridColumnDef<SessionRow>[]>(() => {
    const cols: GridColumnDef<SessionRow>[] = [];

    // Exclude column — only in generate mode
    if (mode === 'generate') {
      cols.push({
        id: 'exclude',
        accessorFn: (row) => (excludedIndices.has(row._idx) ? 1 : 0),
        header: t('Exclude'),
        size: 80,
        enableSorting: false,
        Cell: ({ row }) => {
          const session = row.original;
          const isExcluded = excludedIndices.has(session._idx);
          const isDuplicate = session.alreadyExists;
          return (
            <Checkbox
              size="small"
              checked={isExcluded}
              disabled={isDuplicate}
              onChange={() => toggleExclude(session._idx)}
              sx={isDuplicate ? { opacity: 0.3 } : undefined}
            />
          );
        },
      });
    }

    cols.push(
      {
        id: 'day',
        accessorFn: (row) =>
          getDayOfWeek(getEffectiveDate(row._idx, row), locale),
        header: t('Day'),
        size: 100,
        enableSorting: true,
      },
      {
        id: 'date',
        accessorFn: (row) => getEffectiveDate(row._idx, row),
        header: t('Date'),
        size: 160,
        enableSorting: true,
        Cell: ({ row }) => {
          const session = row.original;
          const effectiveDate = getEffectiveDate(session._idx, session);
          if (mode !== 'generate') {
            return effectiveDate;
          }
          return (
            <TextField
              size="small"
              type="date"
              value={effectiveDate}
              onChange={(e) => {
                if (e.target.value) {
                  setOverrideField(session._idx, 'date', e.target.value);
                }
              }}
              sx={{ minWidth: 140 }}
            />
          );
        },
      },
      {
        id: 'start',
        accessorFn: (row) => getEffectiveStartTime(row._idx, row),
        header: t('Start'),
        size: 130,
        enableSorting: true,
        Cell: ({ row }) => {
          const session = row.original;
          const effectiveTime = getEffectiveStartTime(session._idx, session);
          if (mode !== 'generate') {
            return effectiveTime;
          }
          return (
            <TextField
              size="small"
              type="time"
              value={effectiveTime}
              onChange={(e) => {
                if (e.target.value) {
                  setOverrideField(session._idx, 'startTime', e.target.value);
                }
              }}
              sx={{ minWidth: 110 }}
            />
          );
        },
      },
      {
        id: 'end',
        accessorFn: (row) => getEffectiveEndTime(row._idx, row),
        header: t('End'),
        size: 130,
        enableSorting: true,
        Cell: ({ row }) => {
          const session = row.original;
          const effectiveTime = getEffectiveEndTime(session._idx, session);
          if (mode !== 'generate') {
            return effectiveTime;
          }
          return (
            <TextField
              size="small"
              type="time"
              value={effectiveTime}
              onChange={(e) => {
                if (e.target.value) {
                  setOverrideField(session._idx, 'endTime', e.target.value);
                }
              }}
              sx={{ minWidth: 110 }}
            />
          );
        },
      },
      {
        id: 'room',
        accessorFn: (row) =>
          parseTranslatedLabel(row.roomLabel || undefined, locale),
        header: t('Room'),
        size: 240,
        enableSorting: true,
        Cell: ({ row }) => {
          const session = row.original;
          const effectiveRoomId = getEffectiveRoomId(session._idx, session);
          const hasRoomOverride =
            overrides[String(session._idx)]?.roomId !== undefined;

          if (mode !== 'generate') {
            return parseTranslatedLabel(session.roomLabel || undefined, locale);
          }

          return (
            <Stack direction="row" spacing={1} alignItems="center">
              {session.hasRoomClash && !hasRoomOverride && (
                <Tooltip title={t('Room clash — this room is occupied')}>
                  <WarningAmberIcon color="warning" fontSize="small" />
                </Tooltip>
              )}
              <Autocomplete<IAutocompleteItem, false>
                size="small"
                sx={{ minWidth: 180 }}
                options={roomOptions}
                loading={roomsLoading}
                onOpen={() => void refetchRooms()}
                value={
                  effectiveRoomId
                    ? roomOptions.find((o) => o.ID === effectiveRoomId) ?? null
                    : null
                }
                onChange={(_e, selected) =>
                  setOverrideField(
                    session._idx,
                    'roomId',
                    selected?.ID ?? undefined
                  )
                }
                getOptionLabel={(o) => parseTranslatedLabel(o.label, locale)}
                isOptionEqualToValue={(a, b) => a.ID === b.ID}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('Room')}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {roomsLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Stack>
          );
        },
      },
      {
        id: 'online',
        accessorFn: (row) => (getEffectiveOnline(row._idx, row) ? 1 : 0),
        header: t('Online'),
        size: 100,
        enableSorting: true,
        Cell: ({ row }) => {
          const session = row.original;
          const isOnline = getEffectiveOnline(session._idx, session);
          if (mode !== 'generate') {
            return (
              <Chip
                label={isOnline ? t('Online') : t('In-Person')}
                color={isOnline ? 'info' : 'default'}
                size="small"
              />
            );
          }
          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Switch
                size="small"
                checked={isOnline}
                onChange={(_e, checked) =>
                  setOverrideField(session._idx, 'isOnline', checked)
                }
              />
              <Typography variant="caption">
                {isOnline ? t('Online') : t('In-Person')}
              </Typography>
            </Stack>
          );
        },
      }
    );

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    locale,
    mode,
    roomOptions,
    roomsLoading,
    overrides,
    excludedIndices,
    toggleExclude,
  ]);

  return columns;
}
