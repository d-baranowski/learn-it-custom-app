/**
 * TimeFe — time-only picker bound to a Redux form field.
 * Stores values as bigint milliseconds-since-epoch (proto convention).
 */

import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { kebabCase } from 'change-case';
import { bigIntToDate } from '~/utils/date';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface TimeFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  min?: bigint;
  max?: bigint;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const TimeFe: React.FC<TimeFeProps> = ({
  name,
  label,
  required,
  disabled,
  min,
  max,
  formId: propFormId,
  dataTestId,
  xs,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
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
    <TimePicker
      ampm={false}
      value={value}
      minTime={min ? bigIntToDate(min) : undefined}
      maxTime={max ? bigIntToDate(max) : undefined}
      disabled={disabled}
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
        textField: {
          fullWidth: true,
          required,
          error: !!fieldState.error,
          helperText: fieldState.error?.message,
          inputProps: { 'data-testid': dataTestId ?? kebabCase(name) },
        },
      }}
    />
    </FeGridItem>
  );
};
