/**
 * MarkdownFe — markdown editor field backed by `@uiw/react-md-editor`.
 *
 * Renders the field's value as raw markdown text. The label sits above the
 * editor as a non-floating shrink-style label, matching the legacy element's
 * layout so existing form designs don't visually shift.
 */

import React from 'react';
import { Box, FormControl, FormHelperText, InputLabel } from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import { kebabCase } from 'change-case';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface MarkdownFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  height?: number;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 12 (markdown is full-width). */
  xs?: number;
}

export const MarkdownFe: React.FC<MarkdownFeProps> = ({
  name,
  label,
  required,
  disabled,
  readonly,
  height = 300,
  formId: propFormId,
  dataTestId,
  xs = 12,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field, fieldState } = useFormController<string | undefined>({ formId, name });
  const testId = dataTestId ?? kebabCase(name);

  return (
    <FeGridItem xs={xs}>
    <FormControl fullWidth error={!!fieldState.error} required={required}>
      <InputLabel
        shrink
        sx={{
          position: 'relative',
          left: '-12px',
          top: '5px',
          marginTop: 1,
          color: fieldState.error ? 'error.main' : 'text.primary',
          '&.Mui-focused': {
            color: fieldState.error ? 'error.main' : 'primary.main',
          },
        }}
      >
        {resolvedLabel}
      </InputLabel>
      <Box sx={{ marginTop: 1 }}>
        <MDEditor
          value={field.value ?? ''}
          onChange={(val) => field.onChange(val ?? '')}
          height={height}
          preview="edit"
          hideToolbar={readonly}
          enableScroll={true}
          textareaProps={{
            // @ts-ignore — library typing omits this passthrough
            dataTestId: testId,
            disabled: disabled || readonly,
            placeholder: resolvedLabel,
            required,
            onBlur: field.onBlur,
          }}
          data-color-mode="light"
        />
      </Box>
      {fieldState.error && (
        <FormHelperText error>{fieldState.error.message}</FormHelperText>
      )}
    </FormControl>
    </FeGridItem>
  );
};
