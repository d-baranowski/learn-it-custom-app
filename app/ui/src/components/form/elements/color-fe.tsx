/**
 * ColorFe — hex color field with a native color picker beside a text input.
 *
 * Stores the value as a `#RRGGBB` string. The picker drives the input and
 * vice-versa; typing an invalid pattern is silently ignored to keep stored
 * state always either empty or a valid hex prefix.
 */

import React from 'react';
import { Box, TextField } from '@mui/material';
import { kebabCase } from 'change-case';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface ColorFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const ColorFe: React.FC<ColorFeProps> = ({
  name,
  label,
  required,
  disabled,
  readonly,
  formId: propFormId,
  dataTestId,
  xs,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field, fieldState } = useFormController<string | undefined>({ formId, name });

  const testIdBase = dataTestId ?? kebabCase(name);
  const value = field.value ?? '';

  return (
    <FeGridItem xs={xs}>
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => field.onChange(e.target.value)}
        disabled={disabled || readonly}
        style={{
          width: 60,
          height: 56,
          border: '1px solid rgba(0, 0, 0, 0.23)',
          borderRadius: 4,
          cursor: disabled || readonly ? 'not-allowed' : 'pointer',
        }}
        data-testid={`color-picker-${testIdBase}`}
      />
      <TextField
        label={resolvedLabel}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '' || /^#[0-9A-Fa-f]{0,6}$/.test(next)) {
            field.onChange(next);
          }
        }}
        onBlur={field.onBlur}
        disabled={disabled}
        error={!!fieldState.error}
        helperText={fieldState.error?.message ?? 'Enter color in hex format (e.g., #FF5733)'}
        required={required}
        fullWidth
        inputProps={{
          'aria-readonly': readonly,
          'data-testid': `input-${testIdBase}`,
          maxLength: 7,
          placeholder: '#000000',
        }}
      />
    </Box>
    </FeGridItem>
  );
};
