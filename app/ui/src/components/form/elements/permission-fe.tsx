/**
 * PermissionFe + AbilityFe — static-options autocomplete-style selects
 * for the permissions system. Driven by code-generated lookup tables
 * (no Connect RPC).
 */

import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { kebabCase } from 'change-case';
import { IAutocompleteItem } from '@gen/interface';
import { PermissionAutocompleteItems } from '@gen/permission-autocomplete';
import { AbilityAutocompleteItems } from '@gen/ability-autocomplete';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

interface Option {
  id: string;
  label: string;
}

interface BaseProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

function StaticAutocompleteSelect({
  options,
  ...p
}: BaseProps & { options: Option[] }): React.ReactElement {
  const ctxFormId = useFormId();
  const formId = p.formId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(p.name, p.label);
  const { field, fieldState } = useFormController<string | string[] | undefined>({
    formId,
    name: p.name,
  });

  const selected: Option | Option[] | null = p.multiple
    ? (Array.isArray(field.value) ? field.value : [])
        .map((id) => options.find((o) => o.id === id))
        .filter((o): o is Option => !!o)
    : options.find((o) => o.id === field.value) ?? null;

  return (
    <FeGridItem xs={p.xs}>
    <Autocomplete<Option, boolean, boolean, false>
      multiple={p.multiple}
      options={options}
      value={selected as never}
      onChange={(_, next) => {
        if (p.multiple) {
          const ids = Array.isArray(next) ? next.map((n) => n.id) : [];
          field.onChange(ids);
        } else {
          field.onChange((next as Option | null)?.id ?? '');
        }
      }}
      onBlur={field.onBlur}
      getOptionLabel={(opt) => opt.label}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      autoHighlight
      readOnly={p.disabled}
      disabled={p.disabled}
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          label={resolvedLabel}
          required={p.required}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          inputProps={{
            ...params.inputProps,
            'data-testid': p.dataTestId ?? kebabCase(p.name),
          }}
        />
      )}
    />
    </FeGridItem>
  );
}

function toOptions(items: IAutocompleteItem[]): Option[] {
  return items.map((o) => ({ id: o.ID, label: o.label }));
}

export const PermissionFe: React.FC<BaseProps> = (props) => {
  const options = React.useMemo(
    () => toOptions(PermissionAutocompleteItems ?? []),
    []
  );
  return <StaticAutocompleteSelect {...props} options={options} />;
};

export interface AbilityFeProps extends BaseProps {
  /** Permission key whose abilities are listed. */
  permission?: string;
}

export const AbilityFe: React.FC<AbilityFeProps> = ({ permission, ...rest }) => {
  const options = React.useMemo(
    () => toOptions(permission ? (AbilityAutocompleteItems[permission] ?? []) : []),
    [permission]
  );
  return <StaticAutocompleteSelect {...rest} options={options} />;
};
