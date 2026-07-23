/**
 * DateTimeFe — date+time picker bound to a Redux form field.
 *
 * Matches the legacy DateTimeFe contract: stores values as `bigint`
 * milliseconds-since-epoch (matching the proto convention), 24h time,
 * actionBar with today+accept.
 */

import React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { kebabCase } from 'change-case';
import { bigIntToDate } from '~/utils/date';
import { useLocaleDateTimeFormat } from '~/utils/locale';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface DateTimeFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  disablePast?: boolean;
  min?: bigint;
  max?: bigint;
  endAdornment?: React.ReactNode;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const DateTimeFe: React.FC<DateTimeFeProps> = ({
  name,
  label,
  required,
  disabled,
  disablePast = false,
  min,
  max,
  endAdornment,
  formId: propFormId,
  dataTestId,
  xs,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const dateTimeFormat = useLocaleDateTimeFormat();
  const { field, fieldState } = useFormController<string | bigint | undefined>({
    formId,
    name,
  });

  const ms =
    field.value === undefined || field.value === null
      ? null
      : Number(field.value as bigint | string);
  const value = ms !== null && !Number.isNaN(ms) ? new Date(ms) : null;

  return (
    <FeGridItem xs={xs}>
    <DateTimePicker
      ampm={false}
      format={dateTimeFormat}
      minDateTime={min ? bigIntToDate(min) : undefined}
      maxDateTime={max ? bigIntToDate(max) : undefined}
      value={value}
      disabled={disabled}
      disablePast={disablePast}
      label={resolvedLabel}
      inputRef={field.ref as React.Ref<HTMLInputElement>}
      onChange={(next) => {
        if (!next || isNaN(next.getTime())) {
          field.onChange(undefined);
          return;
        }
        field.onChange(String(next.getTime()));
      }}
      onClose={field.onBlur}
      slotProps={{
        field: { clearable: true },
        textField: (params) => ({
          ...params,
          inputProps: {
            'data-testid': dataTestId ?? kebabCase(name),
          },
          fullWidth: true,
          required,
          error: !!fieldState.error,
          helperText: fieldState.error?.message,
          InputProps: {
            ...params.InputProps,
            endAdornment: (
              <>
                {endAdornment}
                {params.InputProps?.endAdornment}
              </>
            ),
          },
        }),
        actionBar: {
          actions: ['today', 'accept'],
        },
      }}
    />
    </FeGridItem>
  );
};
