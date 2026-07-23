import React from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import Tooltip from '@mui/material/Tooltip';
import { SxProps } from '@mui/material/styles';
import { useTranslation } from 'next-i18next';
import useFilters from '~/_lib/grid/hooks/use-filters';
import { useGridSettings } from '~/_lib/grid/context/grid-settings-context';

interface Props {
  sx?: SxProps;
}

const ClearAllFiltersBtn: React.FunctionComponent<Props> =
  function ClearAllFiltersBtn(props) {
    const { t } = useTranslation('common');
    const { gridName } = useGridSettings();
    const { hasFilters, clear } = useFilters(gridName);

    const tooltip = hasFilters
      ? t('Clear All Filters (filters active)')
      : t('Clear All Filters');

    return (
      <Tooltip arrow title={tooltip}>
        <span>
          <IconButton
            sx={props.sx}
            onClick={clear}
            disabled={!hasFilters}
            color={hasFilters ? 'warning' : 'default'}
          >
            <Badge
              color="warning"
              variant="dot"
              invisible={!hasFilters}
              overlap="circular"
            >
              <FilterAltOffIcon />
            </Badge>
          </IconButton>
        </span>
      </Tooltip>
    );
  };

export default ClearAllFiltersBtn;
