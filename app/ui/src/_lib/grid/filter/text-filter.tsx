import React, {ChangeEvent} from 'react';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import {WhereOperator} from '@gen/request/v1/base_pb';
import IconXCircle from '@mui/icons-material/HighlightOff';
import FilterAdornment from '~/_lib/grid/filter/filter-adornment';
import {capitalCase} from 'change-case';
import debounce from 'lodash/debounce';
import useFilter from '~/_lib/grid/hooks/use-filter';

const FILTER_DEBOUNCE_MS = 300;

type TextFilterOperator =
  WhereOperator.ILIKE |
  WhereOperator.STARTSWITH |
  WhereOperator.ENDSWITH |
  WhereOperator.VAL_IN_COL;

interface TextFilterProps {
  id: string,
  label: string,
  defaultOperator?: TextFilterOperator,
  disabled?: boolean,
  operators?: TextFilterOperator[],
  dataTestId?: string,
}

const TextFilter: React.FC<TextFilterProps> = (props) => {
  const {
    id,
    label,
    defaultOperator = WhereOperator.ILIKE,
    disabled,
    operators = [
      WhereOperator.ILIKE,
      WhereOperator.STARTSWITH,
      WhereOperator.ENDSWITH,
    ],
    dataTestId = "filter-" + id,
  } = props;

  const {
    value,
    removeFilter,
    setValue,
    setOperator,
    operator,
  } = useFilter<string>({
    id,
    defaultValue: "",
    defaultOperator: defaultOperator,
  });

  const [localValue, setLocalValue] = React.useState(value);

  const debouncedSetValue = React.useMemo(
    () => debounce((newText: string) => setValue(newText), FILTER_DEBOUNCE_MS),
    [setValue],
  );

  React.useEffect(() => debouncedSetValue.cancel, [debouncedSetValue]);

  // Re-sync when the filter is cleared or reset elsewhere (e.g. clear-all).
  React.useEffect(() => {
    if (!value) setLocalValue('');
  }, [value]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setLocalValue(newText);
    debouncedSetValue(newText);
  };


  const handleOperatorChange = (newOperator: WhereOperator) => {
    setOperator(newOperator);
  };

  const handleClearFilter = () => {
    debouncedSetValue.cancel();
    setLocalValue('');
    removeFilter();
  };

  return (
    <TextField
      id={id}
      label={capitalCase(label)}
      //variant="outlined"
      disabled={disabled}
      value={localValue}
      onChange={handleInputChange}
      data-testfilterfor={id}
      sx={{
        width: '100%',
      }}
      autoComplete="no"
      InputProps={{
        startAdornment: <FilterAdornment
          operator={operator ?? defaultOperator}
          onOperatorChange={handleOperatorChange}
          operators={operators}
        />,
        endAdornment: (
          <InputAdornment position="end">
            {localValue && (
              <IconButton
                edge="end"
                aria-label="Clear filter"
                onClick={handleClearFilter}
                onMouseDown={(e) => e.preventDefault()}
                sx={{
                  p: 0,
                  m: 0,
                }}
              >
                <IconXCircle />
              </IconButton>
            )}
          </InputAdornment>
        ),
      }}
      inputProps={{
        ...{ 'data-testid': dataTestId },
      }}
    />
  );
};

export default TextFilter;
