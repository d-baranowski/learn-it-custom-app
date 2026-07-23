import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import {WhereOperator} from '@gen/request/v1/base_pb';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import useFilter from '~/_lib/grid/hooks/use-filter';

interface BooleanFilterProps {
  id: string,
  label: string,
  defaultValue?: 'yes' | 'no' | 'all',
}

const BooleanFilter: React.FC<BooleanFilterProps> = (props) => {
  const { id, label, defaultValue = 'all' } = props;
  const {
    value,
    removeFilter,
    setValue,
  } = useFilter<boolean | undefined | null>({
    id,
    defaultValue: undefined,
    defaultOperator: WhereOperator.EQ,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = (event.target as HTMLInputElement).value;

    if (val === 'all') {
      removeFilter();
      return;
    }

    setValue(valToBool(val));
  };

  return (
    <FormControl>
      <FormLabel data-testfilterfor={id} id={`${id}-row-radio-buttons-group-label`}>{label}</FormLabel>
      <RadioGroup
        row
        aria-labelledby={`${id}-row-radio-buttons-group-label`}
        name={`${id}`}
        value={boolToVal(value)}
        onChange={handleChange}
      >
        <FormControlLabel value="all" control={<Radio />} label="All" />
        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
        <FormControlLabel value="no" control={<Radio />} label="No" />
      </RadioGroup>
    </FormControl>
  );
};

const valToBool = (val: string) => {
  if (val === 'all') {
    return undefined;
  }
  return val === 'yes';
};

const boolToVal = (val: boolean | undefined) => {
  if (val === undefined) {
    return 'all';
  }
  return val ? 'yes' : 'no';
};

export default BooleanFilter;
