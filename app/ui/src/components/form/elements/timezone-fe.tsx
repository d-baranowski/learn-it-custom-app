/**
 * TimezoneFe — IANA timezone select. Static-list autocomplete.
 *
 * The list comes from `Intl.supportedValuesOf('timeZone')` at module load
 * (stable across the runtime); falls back to a tiny hand-picked list on
 * runtimes that predate that API.
 */

import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { kebabCase } from 'change-case';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

const TIMEZONE_OPTIONS: string[] = (() => {
  const sup = (Intl as unknown as {
    supportedValuesOf?: (k: string) => string[];
  }).supportedValuesOf;
  if (typeof sup === 'function') {
    try {
      return sup('timeZone');
    } catch {
      /* fall through */
    }
  }
  return ['UTC', 'Europe/Warsaw', 'Europe/London', 'America/New_York'];
})();

export interface TimezoneFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const TimezoneFe: React.FC<TimezoneFeProps> = ({
  name,
  label,
  required,
  disabled,
  formId: propFormId,
  dataTestId,
  xs,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field, fieldState } = useFormController<string | undefined>({ formId, name });

  return (
    <FeGridItem xs={xs}>
    <Autocomplete
      options={TIMEZONE_OPTIONS}
      value={field.value ?? null}
      onChange={(_, next) => field.onChange(next ?? '')}
      onBlur={field.onBlur}
      autoHighlight
      disableClearable={required}
      readOnly={disabled}
      disabled={disabled}
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          label={resolvedLabel}
          required={required}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
          inputProps={{
            ...params.inputProps,
            'data-testid': dataTestId ?? kebabCase(name),
          }}
        />
      )}
    />
    </FeGridItem>
  );
};
