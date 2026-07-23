/**
 * StringFe — single-line text input bound to a Redux form field.
 *
 * Wrapped in a Grid item so it composes with the Grid container that
 * <Form> / <FormTab> provide. Default span is 6 (two per row, mirroring
 * legacy `xs={6}`); multiline strings default to 12.
 */

import React from 'react';
import { Grid, TextField, TextFieldProps } from '@mui/material';
import { kebabCase } from 'change-case';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';

export interface StringFeProps
  extends Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'inputRef' | 'error' | 'helperText' | 'label'> {
  name: string;
  label?: string;
  defaultValue?: string;
  helperText?: React.ReactNode;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6, or 12 if multiline. */
  xs?: number;
}

export const StringFe: React.FC<StringFeProps> = ({
  name,
  label,
  defaultValue,
  helperText,
  formId: propFormId,
  dataTestId,
  inputProps,
  xs,
  multiline,
  fullWidth = true,
  ...textFieldProps
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field, fieldState } = useFormController<string>({ formId, name, defaultValue });
  const span = xs ?? (multiline ? 12 : 6);

  return (
    <Grid item xs={span}>
      <TextField
        {...textFieldProps}
        name={name}
        label={resolvedLabel}
        value={field.value ?? ''}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
        inputRef={field.ref as React.Ref<HTMLInputElement>}
        error={!!fieldState.error}
        helperText={fieldState.error?.message ?? helperText}
        multiline={multiline}
        fullWidth={fullWidth}
        inputProps={{
          'data-testid': dataTestId ?? kebabCase(name),
          ...inputProps,
        }}
      />
    </Grid>
  );
};
