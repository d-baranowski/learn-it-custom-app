import React from 'react';
import MuiAutocomplete, {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  AutocompleteProps,
  AutocompleteRenderInputParams
} from '@mui/material/Autocomplete';
import InputAdornment from "@mui/material/InputAdornment";
import TextField from '@mui/material/TextField';
import {IAutocompleteOption} from "./types";
import {IconLoading} from "~/components/icon";


type IBaseAutocompleteProps = Omit<AutocompleteProps<any, boolean, boolean, boolean>,
  'field' | 'form' | 'meta' | 'renderInput' | 'options' | 'onChange'> & {
  name: string;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  options: IAutocompleteOption[];
  preFilterOptions?: (option: IAutocompleteOption) => boolean;
  value: any;
  error?: boolean,
  helperText?: string,
  clearable?: boolean,
  multiple?: boolean,
  setValue: (value: string | string[]) => void
  startAdornment?: React.ReactNode;
  skipRendering?: boolean
  afterChange?: (value: any, option: any | undefined) => void
  sx?: any,
  optionChangeEffect?: (option: any | undefined) => void
  placeholder?: string
};

const BaseAutocomplete: React.FC<IBaseAutocompleteProps> = (props) => {
  const {
    name,
    label,
    error,
    helperText,
    loading,
    setValue,
    value,
    options = [],
    preFilterOptions,
    multiple,
    clearable = true,
    disabled,
    skipRendering,
    afterChange,
    startAdornment,
    optionChangeEffect,
    placeholder,
    ...rest
  } = props;

  let optionsArrayOrOption: any;
  if (Array.isArray(value)) {
    optionsArrayOrOption = options.filter(option => {
      return !!value.find((id: string) => option.id == id)
    })
  } else if (!multiple) {
    optionsArrayOrOption = options.find((option) => option.id == value)
  } else {
    optionsArrayOrOption = []
  }

  const onChange = React.useCallback((
    e: React.SyntheticEvent,
    value: any,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<any>,
  ) => {
    if (Array.isArray(value)) {
      setValue(value.map(v => v.id));
    } else {
      setValue(value?.id === undefined ? null : value.id);
    }

    if (reason === "clear") {
      afterChange && afterChange(null, null);
    } else {
      afterChange && afterChange(value?.id, details?.option);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getOptionLabel = React.useCallback((option: string | IAutocompleteOption) => {
    if (typeof option === 'string') {
      const foundOption = options.find(o => o.id === option);
      return foundOption ? foundOption.name : option;
    }
    return option?.name || "Unknown"
  }, [options])

  const isOptionEqualToValue = React.useCallback((option: IAutocompleteOption, value: IAutocompleteOption) => {
    if (!option || !value) {
      return false
    }
    return option.id === value.id;
  }, [])

  const filteredOptions = React.useMemo(() => {
    if (!preFilterOptions) {
      return options
    }

    return options.filter(preFilterOptions)
  }, [options, preFilterOptions])

  React.useEffect(() => {
    if (!optionChangeEffect) {
      return
    }

    optionChangeEffect(optionsArrayOrOption)
  }, [optionChangeEffect, optionsArrayOrOption])

  return (
    <MuiAutocomplete
      {...rest}
      disabled={disabled || (loading && !options?.length)}
      loading={loading && !options?.length}
      options={filteredOptions}
      value={optionsArrayOrOption || null}
      size="small"
      disableClearable={!clearable}
      multiple={multiple}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      onChange={onChange}
      renderInput={(params: AutocompleteRenderInputParams) => {
        const {
          InputLabelProps,
          ...rest
        } = params

        return (
          <TextField
            {...rest}
            name={`${name}-autocomplete`}
            label={label ?? name}
            variant="outlined"
            error={!!error}
            helperText={<span data-testid={name + ":error"}>{helperText}</span>}
            inputProps={
              {
                "data-testid": name,
                "data-test-value": value,
                ...(rest?.inputProps || {}),
                autoComplete: "off",
                placeholder: props.placeholder || ""
              }
            }
            InputProps={{
              ...(rest?.InputProps || {}),
              startAdornment: loading && !options?.length ? <InputAdornment style={{marginLeft: "10px"}}
                                                                            position="start"><IconLoading/></InputAdornment> : startAdornment ? startAdornment : rest?.InputProps.startAdornment,
              autoComplete: "off",
            }}
            InputLabelProps={{
              shrink: true,
              variant: "outlined"
            }}
          />)
      }}
      {...rest}
    />
  )
}

type PropsSame = (prev: IBaseAutocompleteProps, next: IBaseAutocompleteProps) => boolean

const propsSame: PropsSame = (prev, next) => {
  if (!next.skipRendering) {
    return false
  }

  if (prev.value != next.value) {
    return false
  }

  if (prev.helperText != next.helperText) {
    return false
  }

  if (prev.options != next.options) {
    return false
  }

  if (prev.startAdornment != next.startAdornment) {
    return false
  }

  return true
}

export default React.memo(BaseAutocomplete, propsSame);
