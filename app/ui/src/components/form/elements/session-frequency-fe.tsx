/**
 * SessionFrequencyFe — owns a `repeated SessionFrequencyEntry` field.
 *
 * Card-based schedule builder with inline sentence-style controls,
 * day-of-week pills, and segmented in-person/online toggle.
 */

import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { PillNumber } from './pill-number';
import { PillSelect } from './pill-select';
import { PillTime } from './pill-time';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Home as InPersonIcon,
  Videocam as OnlineIcon,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@connectrpc/connect-query';
import { kebabCase } from 'change-case';

import { autocomplete as roomAutocomplete } from '@gen/core/v1/room-RoomService_connectquery';
import { DayOfWeek, FrequencyUnit } from '@gen/core/v1/enums_pb';
import { AutocompleteRequest } from '@gen/request/v1/base_pb';
import useEnumOptions from '~/hooks/use-enum-options';

import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useFormRecord } from '~/_lib/forms/state/hooks';
import { DefaultAutocompleteOrder } from './types';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface SessionFrequencyFeProps {
  name: string;
  label?: string;
  disabled?: boolean;
  formId?: string;
  dataTestId?: string;
  xs?: number;
  sessionDuration?: number;
}

const toLocalMsOfDayFromHm = (hh: number, mm: number) =>
  hh * 60 * 60 * 1000 + mm * 60 * 1000;

const toLocalHmFromMsOfDay = (msOfDay: number) => {
  const totalMinutes = Math.floor(msOfDay / (60 * 1000));
  return {
    hh: Math.floor(totalMinutes / 60),
    mm: totalMinutes % 60,
  };
};

const startTimeLabel = (msRaw: bigint | number | string | undefined) => {
  const ms =
    msRaw === undefined ? toLocalMsOfDayFromHm(9, 0) : Number(msRaw);
  const { hh, mm } = toLocalHmFromMsOfDay(ms);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const ISO_DAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const useDayLabels = () => {
  const { i18n } = useTranslation('common');
  return React.useMemo(() => {
    const locale = i18n.language || 'en';
    const base = new Date('2024-01-01'); // Monday
    return ISO_DAYS.map((day, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const narrow = d.toLocaleDateString(locale, { weekday: 'narrow' });
      return { day, short: narrow };
    });
  }, [i18n.language]);
};

type SessionFrequencyEntryJson = {
  every?: number;
  onDay?: DayOfWeek[];
  startTimeMs?: string;
  unit?: FrequencyUnit;
  isOnline?: boolean;
  roomId?: string;
};

const ScheduleSummary: React.FC<{
  entry: SessionFrequencyEntryJson;
  dayOptions: { id: number; label: string }[];
  roomOptions: { id: string; label: string }[];
  t: (key: string, opts?: any) => string;
}> = ({ entry, dayOptions, roomOptions, t }) => {
  const every = entry.every ?? 1;
  const unitKey = entry.unit === FrequencyUnit.MONTH
    ? (every === 1 ? 'Every month' : 'Every {{n}} months')
    : (every === 1 ? 'Every week' : 'Every {{n}} weeks');
  const days = (entry.onDay ?? [])
    .slice()
    .sort((a, b) => a - b)
    .map((d) => dayOptions.find((o) => o.id === d)?.label)
    .filter(Boolean)
    .join(', ');
  const time = startTimeLabel(entry.startTimeMs);
  const mode = entry.isOnline ? t('online') : t('in person');
  const room = entry.isOnline
    ? ''
    : roomOptions.find((r) => r.id === entry.roomId)?.label ?? '';

  const parts = [
    t(unitKey, { n: every }),
    days ? `${t('on')} ${days}` : '',
    `${t('at')} ${time}`,
    mode,
    room,
  ].filter(Boolean);

  return (
    <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
      {parts.join(' · ')}
    </Typography>
  );
};

export const SessionFrequencyFe: React.FC<SessionFrequencyFeProps> = ({
  name,
  label,
  disabled = false,
  formId: propFormId,
  dataTestId,
  xs = 12,
  sessionDuration,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { t } = useTranslation('common');
  const dayLabels = useDayLabels();
  const dayOptions = useEnumOptions('DayOfWeek', undefined, false);
  const unitOptions = useEnumOptions('FrequencyUnit', undefined, false);
  const roomRequest = React.useMemo(
    () => new AutocompleteRequest({ order: DefaultAutocompleteOrder }),
    []
  );
  const { data: roomData } = useQuery(roomAutocomplete, roomRequest);
  const roomOptions = React.useMemo(
    () =>
      roomData?.items?.map((room) => ({ id: room.ID, label: room.label })) ??
      [],
    [roomData]
  );

  const { field } = useFormController<SessionFrequencyEntryJson[] | undefined>({
    formId,
    name,
  });
  const entries: SessionFrequencyEntryJson[] = field.value ?? [];
  const testId = dataTestId ?? kebabCase(name);
  const formRecord = useFormRecord(formId);
  const formErrors = formRecord?.errors ?? {};

  const writeEntries = (next: SessionFrequencyEntryJson[]) => field.onChange(next);

  const addEntry = () => {
    writeEntries([
      ...entries,
      {
        every: 1,
        onDay: [],
        startTimeMs: String(toLocalMsOfDayFromHm(9, 0)),
        unit: FrequencyUnit.WEEK,
        isOnline: false,
      },
    ]);
  };

  const removeEntry = (index: number) => {
    writeEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, patch: Partial<SessionFrequencyEntryJson>) => {
    const next = [...entries];
    next[index] = { ...entries[index], ...patch };
    writeEntries(next);
  };

  const toggleDay = (index: number, day: DayOfWeek) => {
    const onDay = entries[index].onDay || [];
    const newOnDay = onDay.includes(day)
      ? onDay.filter((d) => d !== day)
      : [...onDay, day];
    updateEntry(index, { onDay: newOnDay });
  };

  const setStartTime = (index: number, value: string) => {
    const [hhStr, mmStr] = value.split(':');
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return;
    updateEntry(index, { startTimeMs: String(toLocalMsOfDayFromHm(hh, mm)) });
  };

  return (
    <FeGridItem xs={xs}>
      <Box data-testid={testId}>
        <Stack spacing={1.5}>
          {entries.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', py: 2 }}
            >
              {t('No schedules defined. Add a schedule to set up recurring sessions.')}
            </Typography>
          )}

          {entries.map((entry, index) => {
            const roomError = formErrors[`${name}.${index}.roomId`];
            const unit = entry.unit || FrequencyUnit.WEEK;

            return (
              <Box
                key={index}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                }}
              >
                {/* Summary header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: (theme) => `${theme.palette.primary.main}0A`,
                    borderBottom: '1px solid',
                    borderColor: (theme) => `${theme.palette.primary.main}20`,
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <ScheduleSummary
                    entry={entry}
                    dayOptions={dayOptions}
                    roomOptions={roomOptions}
                    t={t}
                  />
                  <Tooltip title={t('Remove schedule')}>
                    <IconButton
                      size="small"
                      onClick={() => removeEntry(index)}
                      disabled={disabled}
                      sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Recurrence */}
                <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block', letterSpacing: 1 }}
                  >
                    {t('Repeats')}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                    <Typography variant="body2">{t('Every')}</Typography>
                    <PillNumber
                      value={entry.every ?? 1}
                      onChange={(n) => updateEntry(index, { every: n })}
                      disabled={disabled}
                      data-testid={`frequency-every-${index}`}
                    />
                    <PillSelect
                      value={unit}
                      options={unitOptions}
                      onChange={(id) => updateEntry(index, { unit: id as FrequencyUnit })}
                      disabled={disabled}
                      data-testid={`frequency-unit-${index}`}
                    />
                    <Typography variant="body2">{t('on')}</Typography>

                    {/* Day pills */}
                    <Stack direction="row" spacing={0.5}>
                      {dayLabels.map(({ day, short }, dayIdx) => {
                        const selected = entry.onDay?.includes(day) ?? false;
                        return (
                          <Button
                            key={dayIdx}
                            size="small"
                            variant={selected ? 'contained' : 'outlined'}
                            onClick={() => toggleDay(index, day)}
                            disabled={disabled}
                            sx={{
                              minWidth: 34,
                              width: 34,
                              height: 34,
                              p: 0,
                              fontSize: 12,
                              fontWeight: selected ? 700 : 400,
                              borderColor: 'divider',
                              ...(selected ? {} : { color: 'text.secondary' }),
                            }}
                          >
                            {short}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Stack>

                  {/* Time */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
                    <Typography variant="body2">{t('at')}</Typography>
                    <PillTime
                      value={startTimeLabel(entry.startTimeMs)}
                      onChange={(v) => setStartTime(index, v)}
                      disabled={disabled}
                    />
                    {sessionDuration && (
                      <Typography variant="body2" color="text.secondary">
                        {t('for {{n}} min', { n: sessionDuration })}{' '}
                        <Typography component="span" variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          ({t('from therapy config')})
                        </Typography>
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* Location */}
                <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block', letterSpacing: 1 }}
                  >
                    {t('Location')}
                  </Typography>

                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <ToggleButtonGroup
                      value={entry.isOnline ? 'online' : 'inPerson'}
                      exclusive
                      onChange={(_, val) => {
                        if (!val) return;
                        const isOnline = val === 'online';
                        updateEntry(index, {
                          isOnline,
                          roomId: isOnline ? undefined : entry.roomId,
                        });
                      }}
                      size="small"
                      disabled={disabled}
                    >
                      <ToggleButton value="inPerson" sx={{ px: 1.5, gap: 0.5, textTransform: 'none', fontSize: 13 }}>
                        <InPersonIcon sx={{ fontSize: 16 }} />
                        {t('In person')}
                      </ToggleButton>
                      <ToggleButton value="online" sx={{ px: 1.5, gap: 0.5, textTransform: 'none', fontSize: 13 }}>
                        <OnlineIcon sx={{ fontSize: 16 }} />
                        {t('Online')}
                      </ToggleButton>
                    </ToggleButtonGroup>

                    {!entry.isOnline && (
                      <Autocomplete
                        size="small"
                        sx={{ minWidth: 160 }}
                        options={roomOptions}
                        value={
                          roomOptions.find((o) => o.id === entry.roomId) ??
                          (entry.roomId
                            ? { id: entry.roomId, label: entry.roomId }
                            : null)
                        }
                        onChange={(_, next) =>
                          updateEntry(index, { roomId: next ? next.id : undefined })
                        }
                        getOptionLabel={(opt) => opt.label}
                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                        autoHighlight
                        disabled={disabled}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('Room')}
                            required
                            size="small"
                            error={!!roomError}
                            helperText={roomError?.message}
                            inputProps={{
                              ...params.inputProps,
                              name: `${name}.${index}.roomId`,
                              'data-testid':
                                index === 0 ? 'room-id' : `room-id-${index}`,
                            }}
                          />
                        )}
                      />
                    )}
                  </Stack>
                </Box>
              </Box>
            );
          })}

          {/* Add schedule button */}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addEntry}
            disabled={disabled}
            fullWidth
            data-testid={`${testId}-add-schedule`}
            sx={{
              borderStyle: 'dashed',
              color: 'text.secondary',
              borderColor: 'divider',
              py: 1,
            }}
          >
            {entries.length === 0 ? t('Add Schedule') : t('Add another schedule')}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
            {t('Add another schedule if sessions follow more than one pattern (e.g. weekly group + monthly individual).')}
          </Typography>
        </Stack>
      </Box>
    </FeGridItem>
  );
};
