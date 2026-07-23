/**
 * DateFe — date-only picker bound to a Redux form field.
 * Stores values as bigint milliseconds-since-epoch (proto convention).
 */

import React from 'react';
import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { kebabCase } from 'change-case';
import { bigIntToDate } from '~/utils/date';
import { useLocaleDateFormat } from '~/utils/locale';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';

export interface DateFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
  min?: bigint;
  max?: bigint;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const DateFe: React.FC<DateFeProps> = ({
  name,
  label,
  required,
  disabled,
  disablePast,
  disableFuture,
  min,
  max,
  formId: propFormId,
  dataTestId,
  xs = 6,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const dateFormat = useLocaleDateFormat();
  // Stored as a string of milliseconds-since-epoch — protobuf-es' toJson
  // emits int64 as a string, and Redux DevTools / next/router can't
  // serialize raw bigints. The proto constructor on submit accepts the
  // string form just fine.
  const { field, fieldState } = useFormController<string | bigint | undefined>({
    formId,
    name,
  });

  const ms =
    field.value === undefined || field.value === null
      ? null
      : typeof field.value === 'bigint'
        ? Number(field.value)
        : Number(field.value);
  const value = ms !== null && !Number.isNaN(ms) ? new Date(ms) : null;

  return (
    <Grid item xs={xs}>
    <DatePicker
      format={dateFormat}
      value={value}
      minDate={min ? bigIntToDate(min) : undefined}
      maxDate={max ? bigIntToDate(max) : undefined}
      disabled={disabled}
      disablePast={disablePast}
      disableFuture={disableFuture}
      label={resolvedLabel}
      inputRef={field.ref as React.Ref<HTMLInputElement>}
      onChange={(next) => {
        if (!next || isNaN(next.getTime())) {
          field.onChange(undefined);
          return;
        }
        // Store as a string of milliseconds-since-epoch (matches what
        // protobuf-es emits for int64) — keeps Redux DevTools and any
        // JSON.stringify-based middleware happy.
        field.onChange(String(next.getTime()));
      }}
      onClose={field.onBlur}
      slotProps={{
        textField: {
          fullWidth: true,
          required,
          error: !!fieldState.error,
          helperText: fieldState.error?.message,
          inputProps: { 'data-testid': dataTestId ?? kebabCase(name) },
        },
      }}
    />
    </Grid>
  );
};
