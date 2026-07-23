import React from 'react';
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker';
import InputAdornment from '@mui/material/InputAdornment';
import {WhereOperator} from '@gen/request/v1/base_pb';
import FilterAdornment from '~/_lib/grid/filter/filter-adornment';
import useFilter from '~/_lib/grid/hooks/use-filter';
import IconButton from '@mui/material/IconButton';
import {IconXCircle} from '~/components/icon';

type DateTimeFilterOperator =
  WhereOperator.EQ |
  WhereOperator.NEQ |
  WhereOperator.GT |
  WhereOperator.GTE |
  WhereOperator.LT |
  WhereOperator.LTE |
  WhereOperator.BETWEEN |
  WhereOperator.ISNULL |
  WhereOperator.NOTNULL;

export interface DateTimeFilterProps {
  id: string,
  label: string,
  defaultOperator?: DateTimeFilterOperator,
  operators?: DateTimeFilterOperator[],
}

const DateTimeFilter: React.FC<DateTimeFilterProps> = (props) => {
  const {
    id,
    label,
    defaultOperator = WhereOperator.EQ,
    operators = [
      WhereOperator.EQ,
      WhereOperator.NEQ,
      WhereOperator.GT,
      WhereOperator.GTE,
      WhereOperator.LT,
      WhereOperator.LTE,
      WhereOperator.BETWEEN,
      WhereOperator.ISNULL,
      WhereOperator.NOTNULL,
    ],
  } = props;
  
  const {
    value,
    removeFilter,
    setValue,
    setOperator,
    operator,
  } = useFilter<string | number | ''>({
    id,
    defaultValue: '',
    defaultOperator: defaultOperator,
  });
  
  const [localOperator, setLocalOperator] = React.useState<WhereOperator>(operator);
  // Convert string/number to Date for the DateTimePicker
  const dateValue = value ? new Date(Number(value)) : null;

  const handleDateTimeChange = (newValue: Date | null) => {
    if (newValue) {
      setValue(newValue.getTime(), localOperator);
    } else {
      setValue('', localOperator);
    }
  };

  const handleOperatorChange = (newOperator: WhereOperator) => {
    setLocalOperator(newOperator);
    setOperator(newOperator);
  };

  const handleClearFilter = () => {
    removeFilter();
  };

  const isNullOperator = localOperator === WhereOperator.ISNULL || localOperator === WhereOperator.NOTNULL;
  const hasValue = value !== '' && value !== undefined && value !== null;

  return (
    <DateTimePicker
      label={label}
      value={dateValue}
      onChange={handleDateTimeChange}
      disabled={isNullOperator}
      ampm={false}
      format="dd/MM/yyyy HH:mm"
      slotProps={{
        textField : (params) => ({
          ...params,
          id: id,
          fullWidth: true,
          inputProps: {
            'data-testfilterfor': id,
          },
          InputProps: {
            startAdornment: (
              <FilterAdornment
                operator={localOperator ?? defaultOperator}
                onOperatorChange={handleOperatorChange}
                operators={operators}
              />
            ),
            endAdornment: (
              <>
                {params.InputProps?.endAdornment}
                {hasValue && !isNullOperator && (
                  <InputAdornment position="end">
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
                  </InputAdornment>
                )}
              </>
            ),
          },
        }),
      }}
    />
  );
};

export default DateTimeFilter;
