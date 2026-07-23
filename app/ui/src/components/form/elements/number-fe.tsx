/**
 * NumberFe — numeric input bound to a Redux form field.
 *
 * Replacement for the simple-numeric path of `NumberFe` (currency + multi-select
 * variants land later as forms need them). Uses MUI TextField with type="number"
 * and clamps to optional min/max/step on blur.
 */

import React from 'react';
import { Grid, TextField, TextFieldProps } from '@mui/material';
import { kebabCase } from 'change-case';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';

export interface NumberFeProps
  extends Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'inputRef' | 'error' | 'helperText' | 'type' | 'label'> {
  name: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  helperText?: React.ReactNode;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

function clamp(v: number, opts: { min?: number; max?: number; step?: number }): number {
  let out = v;
  if (opts.min !== undefined && out < opts.min) out = opts.min;
  if (opts.max !== undefined && out > opts.max) out = opts.max;
  if (opts.step !== undefined && opts.step > 0) {
    out = Math.round(out / opts.step) * opts.step;
  }
  return out;
}

export const NumberFe: React.FC<NumberFeProps> = ({
  name,
  label,
  min,
  max,
  step,
  helperText,
  formId: propFormId,
  dataTestId,
  xs = 6,
  fullWidth = true,
  ...rest
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field, fieldState } = useFormController<number | undefined>({ formId, name });

  const display =
    field.value === undefined || field.value === null || Number.isNaN(field.value)
      ? ''
      : String(field.value);

  return (
    <Grid item xs={xs}>
      <TextField
        {...rest}
        type="number"
        name={name}
        label={resolvedLabel}
        value={display}
        fullWidth={fullWidth}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            field.onChange(undefined);
            return;
          }
          const parsed = Number(raw);
          if (Number.isNaN(parsed)) return;
          field.onChange(parsed);
        }}
        onBlur={() => {
          if (typeof field.value === 'number') {
            const clamped = clamp(field.value, { min, max, step });
            if (clamped !== field.value) field.onChange(clamped);
          }
          field.onBlur();
        }}
        inputRef={field.ref as React.Ref<HTMLInputElement>}
        error={!!fieldState.error}
        helperText={fieldState.error?.message ?? helperText}
        inputProps={{
          ...rest.inputProps,
          // Mirror legacy: when the field is disabled, expose
          // aria-readonly="true" so screen readers (and the e2e tests that
          // check it) treat it as read-only rather than just inert.
          'aria-readonly': rest.disabled ? true : undefined,
          'data-testid': dataTestId ?? kebabCase(name),
          min,
          max,
          step,
        }}
      />
    </Grid>
  );
};
