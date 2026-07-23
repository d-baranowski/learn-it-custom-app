/**
 * RpgAutocompleteFe — async-fetching autocomplete bound to a Redux form field.
 *
 * Replacement for `~/components/form/elements/rpg-autocomplete-fe.tsx`.
 * Specialised wrappers (TherapistFe, ServiceFe, CustomerFe,
 * etc.) pass the relevant Connect autocomplete RPC + request to this component.
 *
 * Reads formId from <FormContext>; uses useFormController so the component
 * re-renders only when this field's value/error changes.
 */

import React, { useMemo } from 'react';
import { Autocomplete, TextField, AutocompleteProps, Box, TextFieldProps } from '@mui/material';
import {
  MethodUnaryDescriptor,
  callUnaryMethod,
  createConnectQueryKey,
  useTransport,
} from '@connectrpc/connect-query';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { kebabCase } from 'change-case';
import {
  AutocompleteRequest,
  AutocompleteResponse,
} from '@gen/request/v1/base_pb';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

export interface AutocompleteOption {
  id: string;
  label: string;
}

export interface RpgAutocompleteFeProps {
  name: string;
  label?: string;
  query: MethodUnaryDescriptor<AutocompleteRequest, AutocompleteResponse>;
  request?: AutocompleteRequest;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  fullWidth?: boolean;
  /** Override formId when not inside a <Form>. */
  formId?: string;
  /** data-testid for the input. Defaults to kebab-cased name. */
  dataTestId?: string;
  /** Optional transform applied to the option list after the query resolves. */
  optionsTransform?: (options: AutocompleteOption[]) => AutocompleteOption[];
  /** Element rendered to the right of the autocomplete (e.g., a "+" button). */
  endAdornment?: React.ReactNode;
  /** Extra MUI Autocomplete props for fine-tuning. */
  autocompleteProps?: Partial<
    AutocompleteProps<AutocompleteOption, boolean, false, false>
  >;
  /** Extra MUI TextField props applied to the rendered input. */
  textFieldProps?: Partial<TextFieldProps>;
  /** Called when the user picks (or clears) a value. */
  onChange?: (value: string | string[] | null) => void;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

const DEFAULT_REQUEST = new AutocompleteRequest({});

function resolveValue(
  raw: unknown,
  options: AutocompleteOption[],
  multiple: boolean,
  pendingLabel: string | null
): AutocompleteOption | AutocompleteOption[] | null {
  const fallbackLabel = (id: string) => pendingLabel ?? id;
  if (multiple) {
    const ids = Array.isArray(raw) ? (raw as string[]) : [];
    return ids.map(
      (id) => options.find((o) => o.id === id) ?? { id, label: fallbackLabel(id) }
    );
  }
  if (typeof raw !== 'string' || raw === '') return null;
  return options.find((o) => o.id === raw) ?? { id: raw, label: fallbackLabel(raw) };
}

/**
 * Translate a raw label that may be a JSON-stringified TranslatedString
 * (`{en: "...", pl: "...", vi: "..."}`) into the active locale's text.
 * If parsing fails, falls back to running the raw value through `t()`.
 */
function localiseLabel(
  rawLabel: string,
  language: string,
  t: (key: string) => string
): string {
  try {
    const parsed = JSON.parse(rawLabel);
    if (
      parsed &&
      typeof parsed === 'object' &&
      ('en' in parsed || 'pl' in parsed || 'vi' in parsed)
    ) {
      return parsed[language] ?? parsed.en ?? parsed.pl ?? parsed.vi ?? rawLabel;
    }
  } catch {
    // not JSON, fall through
  }
  return t(rawLabel);
}

export const RpgAutocompleteFe: React.FC<RpgAutocompleteFeProps> = ({
  name,
  label,
  query,
  request,
  required,
  disabled,
  multiple = false,
  fullWidth = true,
  formId: propFormId,
  dataTestId,
  optionsTransform,
  endAdornment,
  autocompleteProps,
  textFieldProps,
  onChange: onValueChange,
  xs,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const { t, i18n } = useTranslation('common');
  const transport = useTransport();
  const resolvedLabel = useDefaultLabel(name, label);

  const { field, fieldState } = useFormController<string | string[]>({
    formId,
    name,
  });

  const effectiveRequest = request ?? DEFAULT_REQUEST;
  const queryKey = useMemo(
    () => [...createConnectQueryKey(query, effectiveRequest), i18n.language] as const,
    [query, effectiveRequest, i18n.language]
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => callUnaryMethod(query, effectiveRequest, { transport }),
  });

  const options = useMemo<AutocompleteOption[]>(() => {
    if (!data) return [];
    let out: AutocompleteOption[] =
      data.items?.map((o) => ({
        id: o.ID,
        label: localiseLabel(o.label, i18n.language ?? 'en', t),
      })) ?? [];
    if (optionsTransform) out = optionsTransform(out);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, i18n.language]);

  const pending = isLoading && !data;
  const pendingLabel = pending ? t('Loading...') : null;
  const selected = resolveValue(field.value, options, multiple, pendingLabel);

  const inputId = dataTestId ?? kebabCase(name);

  const handleChange = (
    _event: React.SyntheticEvent,
    next: AutocompleteOption | AutocompleteOption[] | null
  ) => {
    if (multiple) {
      const ids = Array.isArray(next) ? next.map((n) => n.id) : [];
      field.onChange(ids);
      onValueChange?.(ids);
    } else {
      const value = (next as AutocompleteOption | null)?.id ?? '';
      field.onChange(value);
      onValueChange?.(value === '' ? null : value);
    }
  };

  return (
    <FeGridItem xs={xs}>
      <Box
        sx={
          endAdornment
            ? {
                position: 'relative',
                '&& .MuiAutocomplete-endAdornment': {
                  right: '45px',
                },
              }
            : undefined
        }
      >
        <Autocomplete
          multiple={multiple}
          options={options}
          value={selected as never}
          onChange={handleChange}
          onOpen={() => void refetch()}
          onBlur={field.onBlur}
          loading={isLoading && !data}
          disabled={disabled}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          getOptionLabel={(opt) => opt.label}
          autoHighlight
          clearOnBlur={!multiple}
          fullWidth={fullWidth}
          {...autocompleteProps}
          renderInput={(params) => (
            <TextField
              {...params}
              {...textFieldProps}
              label={resolvedLabel}
              required={required}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              InputProps={{ ...params.InputProps, ...textFieldProps?.InputProps }}
              InputLabelProps={{ ...params.InputLabelProps, ...textFieldProps?.InputLabelProps, shrink: true }}
              inputProps={{
                ...params.inputProps,
                ...textFieldProps?.inputProps,
                'data-testid': inputId,
              }}
              sx={
                endAdornment
                  ? {
                      ...textFieldProps?.sx,
                      '&& .MuiFilledInput-root': { paddingRight: '109px' },
                    }
                  : textFieldProps?.sx
              }
            />
          )}
        />
        {endAdornment ? (
          <Box
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {endAdornment}
          </Box>
        ) : null}
      </Box>
    </FeGridItem>
  );
};
