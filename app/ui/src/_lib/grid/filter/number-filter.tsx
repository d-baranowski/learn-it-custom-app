import React, {ChangeEvent} from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import {WhereOperator} from '@gen/request/v1/base_pb';
import FilterAdornment from '~/_lib/grid/filter/filter-adornment';
import useFilter from '~/_lib/grid/hooks/use-filter';
import IconButton from '@mui/material/IconButton';
import {IconXCircle} from '~/components/icon';

type NumberFilterOperator =
  WhereOperator.EQ |
  WhereOperator.NEQ |
  WhereOperator.GT |
  WhereOperator.GTE |
  WhereOperator.LT |
  WhereOperator.LTE |
  WhereOperator.VAL_IN_COL;

interface NumberFilterProps {
  id: string,
  label: string,
  defaultOperator?: NumberFilterOperator,
  operators?: NumberFilterOperator[],
}

const NumberFilter: React.FC<NumberFilterProps> = (props) => {
  const {
    id,
    label,
    defaultOperator = WhereOperator.EQ,
    operators = [
      WhereOperator.EQ,
      WhereOperator.GTE,
      WhereOperator.LTE,
    ],
  } = props;

  const {
    value,
    removeFilter,
    setValue,
    setOperator,
    operator,
  } = useFilter<number | "">({
    id,
    defaultValue: "",
    defaultOperator: defaultOperator,
  });
  
  const [localOperator, setLocalOperator] = React.useState<WhereOperator>(operator);
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setValue(newText as unknown as number, localOperator);
  };

  const handleOperatorChange = (newOperator: WhereOperator) => {
    setLocalOperator(newOperator);
    setOperator(newOperator);
  };

  const handleClearFilter = () => {
    removeFilter();
  };

  return (
    <TextField
      id={id}
      data-testfilterfor={id}
      label={label}
      // variant="outlined"
      value={value !== undefined ? value : null}
      onChange={handleInputChange}
      sx={{
        width: '100%',
      }}
      type="number"
      autoComplete="no"
      InputProps={{
        startAdornment: <FilterAdornment
          operator={localOperator ?? defaultOperator}
          onOperatorChange={handleOperatorChange}
          operators={operators}
        />,
        endAdornment: (
          <InputAdornment position="end">
            {value && (
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
    />
  );
};

export default NumberFilter;
