import React, {useEffect} from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import {enumKeys, enums} from '@gen/enums';
import {AutoCompleteOption, isOptionEqualToValue} from '~/components/form/autocomplete';
import {WhereOperator} from '@gen/request/v1/base_pb';
import {EnumOption} from '~/hooks/use-enum-options';
import {capitalCase} from 'change-case';
import useFilter from '~/_lib/grid/hooks/use-filter';
import {useTranslation} from 'next-i18next';

interface EnumFilterProps {
  id: string,
  label: string,
  placeholder?: string,
  enumKey: enumKeys,
  onChange?: (value: AutoCompleteOption<string>) => void
  operator?: WhereOperator
  enumFilter?: (key: number) => boolean,
}

const EnumFilter: React.FC<EnumFilterProps> = (props) => {
  const {
    id,
    label,
    placeholder,
    enumKey,
    onChange,
    operator = WhereOperator.EQ,
    enumFilter,
  } = props;

  const {
    value,
    removeFilter,
    setValue,
  } = useFilter<string | undefined>({
    id,
    defaultValue: undefined,
    defaultOperator: operator,
  });

  const {t} = useTranslation('common');

  const [options, setOptions] = React.useState<AutoCompleteOption<string>[]>([]);

  useEffect(() => {
    const enumValues = enums[enumKey];

    const opts: EnumOption[] = Object.keys(enumValues)
      .filter((key) => {
          if (enumFilter) {
            return enumFilter(Number(key));
          }
          return true;
        },
      )
      .map((key, _) => {
        return {
          id: parseInt(key),
          label:
            t(enumValues[parseInt(key) as keyof typeof enumValues] ?? 'Unknown') ??
            'Unknown',
        };
      });

    // sort opts by label
    opts.sort((a, b) => a.label.localeCompare(b.label));

    setOptions(opts as any);
  }, [enumFilter, enumKey, t]);

  const optionValue = React.useMemo(() => {
    return options?.find((c) => c.id === value)
  }, [options, value]);

  return (
    <Autocomplete
      id={id}
      data-testfilterfor={id}
      isOptionEqualToValue={isOptionEqualToValue}
      options={options ?? []}
      onChange={(event, value) => {
        if (!value) {
          removeFilter();
          return;
        }
        setValue(value.id);
        if (onChange) {
          onChange(value);
        }
      }}
      renderInput={(params) => <TextField {...params} label={capitalCase(label)} placeholder={placeholder} />}
      sx={{ width: '100%' }}
      value={optionValue}
    />
  );
};

export default EnumFilter;
