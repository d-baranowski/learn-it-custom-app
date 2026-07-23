/**
 * TimeStringFe — time picker for fields stored as HH:mm strings (24h).
 *
 * Mirrors the legacy `~/components/form/elements/time-string-fe.tsx`.
 */

import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { InputAdornment } from '@mui/material';
import { kebabCase } from 'change-case';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

function parseHHmm(s: string | undefined): Date | null {
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatHHmm(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export interface TimeStringFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  formId?: string;
  dataTestId?: string;
  endAdornment?: React.ReactNode;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const TimeStringFe: React.FC<TimeStringFeProps> = ({
  name,
  label,
  required,
  disabled,
  formId: propFormId,
  dataTestId,
  endAdornment,
  xs,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field, fieldState } = useFormController<string | undefined>({ formId, name });

  const value = parseHHmm(field.value);

  return (
    <FeGridItem xs={xs}>
    <TimePicker
      ampm={false}
      format="HH:mm"
      value={value}
      label={resolvedLabel}
      disabled={disabled}
      inputRef={field.ref as React.Ref<HTMLInputElement>}
      onChange={(next) => {
        if (!next || isNaN(next.getTime())) {
          field.onChange(undefined);
          return;
        }
        field.onChange(formatHHmm(next));
      }}
      onClose={field.onBlur}
      slotProps={{
        textField: {
          fullWidth: true,
          required,
          error: !!fieldState.error,
          helperText: fieldState.error?.message,
          inputProps: { 'data-testid': dataTestId ?? kebabCase(name) },
          InputProps: endAdornment ? { endAdornment } : undefined,
        },
      }}
    />
    </FeGridItem>
  );
};
