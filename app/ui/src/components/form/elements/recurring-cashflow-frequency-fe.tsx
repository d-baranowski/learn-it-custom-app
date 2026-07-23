/**
 * RecurringCashflowFrequencyFe — owns a `repeated RecurringCashflowFrequencyEntry`
 * field.
 *
 * Same field-array shape as SessionFrequencyFe: the whole array lives at a
 * single Redux key; this component reads/writes it via useFormController.
 */

import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';

import { RecurringCashflowFrequencyEntry } from '@gen/core/v1/recurring_cashflow_pb';
import { DayOfWeek, FrequencyUnit } from '@gen/core/v1/enums_pb';
import useEnumOptions from '~/hooks/use-enum-options';

import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface RecurringCashflowFrequencyFeProps {
  name: string;
  label?: string;
  disabled?: boolean;
  formId?: string;
  /** Grid item span (1-12). Defaults to 12. */
  xs?: number;
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

const dayAbbreviation = (full: string) => full.substring(0, 3);

export const RecurringCashflowFrequencyFe: React.FC<
  RecurringCashflowFrequencyFeProps
> = ({ name, label, disabled = false, formId: propFormId, xs = 12 }) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { t } = useTranslation('common');
  const dayOptions = useEnumOptions('DayOfWeek', undefined, false);
  const unitOptions = useEnumOptions('FrequencyUnit', undefined, false);
  // See SessionFrequencyFe — entries are plain JSON (string startTimeMs)
  // so Redux DevTools can serialize the form state.
  type RecurringCashflowEntryJson = {
    every?: number;
    onDay?: DayOfWeek[];
    startTimeMs?: string;
    unit?: FrequencyUnit;
  };

  const { field } = useFormController<RecurringCashflowEntryJson[] | undefined>({
    formId,
    name,
  });
  const entries: RecurringCashflowEntryJson[] = field.value ?? [];

  const writeEntries = (next: RecurringCashflowEntryJson[]) =>
    field.onChange(next);

  const addEntry = () => {
    const ms = toLocalMsOfDayFromHm(9, 0);
    writeEntries([
      ...entries,
      {
        every: 1,
        onDay: [],
        startTimeMs: String(ms),
        unit: FrequencyUnit.WEEK,
      },
    ]);
  };

  const removeEntry = (index: number) =>
    writeEntries(entries.filter((_, i) => i !== index));

  const updateEntry = (
    index: number,
    patch: Partial<RecurringCashflowEntryJson>
  ) => {
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
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="subtitle2">{resolvedLabel}</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addEntry}
          disabled={disabled}
          variant="outlined"
        >
          {t('Add Schedule')}
        </Button>
      </Stack>

      <Stack spacing={2}>
        {entries.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic', py: 2 }}
          >
            {t('No schedules defined. Click "Add Schedule" to create one.')}
          </Typography>
        )}

        {entries.map((entry, index) => {
          const unit = entry.unit || FrequencyUnit.WEEK;
          const unitLabel =
            unit === FrequencyUnit.MONTH ? t('month') : t('week');
          const unitLabelPlural =
            unit === FrequencyUnit.MONTH ? t('months') : t('weeks');

          return (
            <Paper key={index} sx={{ p: 2 }} variant="outlined">
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <TextField
                      type="number"
                      label={t('Every N')}
                      value={entry.every ?? 1}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        updateEntry(index, {
                          every: Number.isFinite(n) && n >= 1 ? n : 1,
                        });
                      }}
                      disabled={disabled}
                      inputProps={{ min: 1 }}
                      sx={{ width: 120 }}
                    />

                    <FormControl sx={{ minWidth: 120 }} disabled={disabled}>
                      <InputLabel>{t('Unit')}</InputLabel>
                      <Select
                        label={t('Unit')}
                        value={unit}
                        onChange={(e) =>
                          updateEntry(index, {
                            unit: e.target.value as FrequencyUnit,
                          })
                        }
                      >
                        {unitOptions.map((o) => (
                          <MenuItem key={o.id} value={o.id as number}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      type="time"
                      size="small"
                      label={t('Start Time')}
                      value={startTimeLabel(entry.startTimeMs)}
                      onChange={(e) => setStartTime(index, e.target.value)}
                      disabled={disabled}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 140 }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mr: 1 }}
                      >
                        {t('On Days:')}
                      </Typography>
                      <FormGroup row>
                        {dayOptions.map((dayOption) => (
                          <Tooltip
                            key={dayOption.id}
                            title={dayOption.label}
                            arrow
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={
                                    entry.onDay?.includes(
                                      dayOption.id as DayOfWeek
                                    ) || false
                                  }
                                  onChange={() =>
                                    toggleDay(index, dayOption.id as DayOfWeek)
                                  }
                                  disabled={disabled}
                                  size="small"
                                />
                              }
                              label={dayAbbreviation(dayOption.label)}
                              sx={{ mr: 0.5 }}
                            />
                          </Tooltip>
                        ))}
                      </FormGroup>
                    </Box>
                  </Stack>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1.5, display: 'block' }}
                  >
                    {entry.every === 1
                      ? t(`Every ${unitLabel}`)
                      : t(`Every {{count}} ${unitLabelPlural}`, {
                          count: entry.every,
                        })}{' '}
                    {t('on')}{' '}
                    {entry.onDay && entry.onDay.length > 0
                      ? entry.onDay
                          .slice()
                          .sort((a, b) => a - b)
                          .map(
                            (day) =>
                              dayOptions.find((d) => d.id === day)?.label
                          )
                          .join(', ')
                      : t('no days selected')}
                  </Typography>
                </Box>

                <IconButton
                  onClick={() => removeEntry(index)}
                  disabled={disabled}
                  size="small"
                  sx={{
                    color: 'action.active',
                    '&:hover': {
                      color: 'error.main',
                      backgroundColor: 'error.lighter',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
    </FeGridItem>
  );
};
