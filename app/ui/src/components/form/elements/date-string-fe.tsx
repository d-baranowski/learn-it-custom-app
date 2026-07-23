/**
 * DateStringFe — date picker for fields stored as YYYY-MM-DD strings.
 *
 * The Session/Therapy entities use string dates rather than bigint ms.
 * Mirrors the legacy `~/components/form/elements/date-string-fe.tsx`.
 */

import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { kebabCase } from 'change-case';
import { parseDateString, toDateString } from '~/utils/date';
import { useLocaleDateFormat } from '~/utils/locale';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface DateStringFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const DateStringFe: React.FC<DateStringFeProps> = ({
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
  const dateFormat = useLocaleDateFormat();
  const { field, fieldState } = useFormController<string | undefined>({ formId, name });

  const value = parseDateString(field.value) ?? null;

  return (
    <FeGridItem xs={xs}>
    <DatePicker
      format={dateFormat}
      value={value}
      label={resolvedLabel}
      disabled={disabled}
      inputRef={field.ref as React.Ref<HTMLInputElement>}
      onChange={(next) => {
        if (!next || isNaN(next.getTime())) {
          field.onChange(undefined);
          return;
        }
        field.onChange(toDateString(next));
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
