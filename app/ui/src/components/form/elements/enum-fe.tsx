/**
 * EnumFe — proto-enum select bound to a Redux form field.
 *
 * Replaces the legacy EnumFe. Uses MUI Autocomplete under the hood for
 * consistency with the entity-autocomplete fields.
 */

import React from 'react';
import { Autocomplete, Grid, TextField } from '@mui/material';
import { kebabCase } from 'change-case';
import { enumKeys } from '@gen/enums';
import useEnumOptions from '~/hooks/use-enum-options';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';

interface EnumOption {
  id: number;
  label: string;
}

export interface EnumFeProps {
  name: string;
  label?: string;
  enumKey: enumKeys;
  enumFilter?: (key: string, index: number, array: string[]) => boolean;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  sortByLabel?: boolean;
  fullWidth?: boolean;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const EnumFe: React.FC<EnumFeProps> = ({
  name,
  label,
  enumKey,
  enumFilter,
  multiple = false,
  required,
  disabled,
  sortByLabel = true,
  fullWidth = true,
  formId: propFormId,
  dataTestId,
  xs = 6,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field, fieldState } = useFormController<number | number[] | undefined>({ formId, name });

  const options = useEnumOptions(enumKey, enumFilter, sortByLabel);

  // Resolve the stored numeric id(s) into the option object(s) MUI expects.
  const selected: EnumOption | EnumOption[] | null = multiple
    ? (Array.isArray(field.value) ? field.value : [])
        .map((id) => options.find((o) => o.id === id))
        .filter((o): o is EnumOption => !!o)
    : options.find((o) => o.id === field.value) ?? null;

  return (
    <Grid item xs={xs}>
    <Autocomplete<EnumOption, boolean, boolean, false>
      multiple={multiple}
      options={options}
      value={selected as never}
      onChange={(_, next) => {
        if (multiple) {
          const ids = Array.isArray(next) ? next.map((n) => n.id) : [];
          field.onChange(ids);
        } else {
          const id = (next as EnumOption | null)?.id;
          field.onChange(id);
        }
      }}
      onBlur={field.onBlur}
      getOptionLabel={(opt) => opt.label}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      autoHighlight
      disableClearable={required}
      disabled={disabled}
      readOnly={disabled}
      fullWidth={fullWidth}
      renderInput={(params) => (
        <TextField
          {...params}
          label={resolvedLabel}
          required={required}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          inputProps={{
            ...params.inputProps,
            name,
            'data-testid': dataTestId ?? kebabCase(name),
          }}
        />
      )}
    />
    </Grid>
  );
};
