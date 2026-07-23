import React, {FC, useCallback, useState} from 'react';
import {type MethodUnaryDescriptor, useQuery,} from '@connectrpc/connect-query';
import {AutocompleteRequest, AutocompleteResponse, WhereOperator,} from '@gen/request/v1/base_pb';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import {IAutocompleteItem} from '@gen/interface';
import useFilter from '~/_lib/grid/hooks/use-filter';
import useFilters from '~/_lib/grid/hooks/use-filters';
import {useGridSettings} from '../context/grid-settings-context';
import {useTranslation} from 'next-i18next';

export interface AutocompleteFilterProps {
  id: string;
  label: string;
  disabled?: boolean;
  query: MethodUnaryDescriptor<AutocompleteRequest, AutocompleteResponse>;
  requestBuilder?: (formValues: any) => AutocompleteRequest;
  /** Operator to use when applying the filter. Defaults to EQ.
   *  Use VAL_IN_COL for repeated/array columns (e.g. customerIds). */
  defaultOperator?: WhereOperator;
}

export const AutocompleteFilter: FC<AutocompleteFilterProps> = (props) => {
  const { t } = useTranslation('common');
  const {
    id,
    label,
    disabled = false,
    query,
    requestBuilder,
    defaultOperator = WhereOperator.EQ,
  } = props;
  const [request, setRequest] = useState<AutocompleteRequest | undefined>(
    props?.requestBuilder ? undefined : new AutocompleteRequest(),
  );

  const { value, removeFilter, setValue } = useFilter<string>({
    id,
    defaultValue: '',
    defaultOperator,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onFilterChange = useCallback(
    (optionID: string | null) => {
      if (!optionID) {
        removeFilter();
        return;
      } else {
        setValue(optionID);
      }
    },
    [removeFilter, setValue],
  );

  const {gridName} = useGridSettings();
  const { values } = useFilters(gridName);

  React.useEffect(() => {
    if (!requestBuilder) {
      return;
    }
    setRequest(requestBuilder(values || {}));
  }, [requestBuilder, values, setRequest]);

  const { data, isLoading, refetch } = useQuery(query, request, {
    enabled: request !== undefined,
  });
  const options: IAutocompleteItem[] =
    data?.items?.map((o) => ({ ID: o.ID, label: o.label })) ?? [];
  return (
    <Autocomplete<IAutocompleteItem, false>
      sx={{ width: '100%' }}
      options={options}
      loading={isLoading}
      disabled={disabled}
      data-testid={`filter-${id}`}
      onOpen={() => {
        refetch();
      }}
      value={
        // Fall back to a stub option when the redux filter has a value but
        // it isn't in the current options list (e.g. the filter was just
        // set via right-click cell-filter and options haven't been
        // refetched yet). Showing the raw id is ugly but it ensures the
        // chip reflects an active filter — the real label resolves as soon
        // as options load.
        value
          ? options.find((o) => o.ID === value) || { ID: value, label: value }
          : null
      }
      onChange={(event, value, reason, details) => {
        if (!value) {
          onFilterChange(null);
        } else {
          onFilterChange(value.ID);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t(label)}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};
