import React from 'react';
import IconButton from '@mui/material/IconButton';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import Tooltip from '@mui/material/Tooltip';
import useFiltersModal from '~/_lib/grid/hooks/use-filters-modal';
import {SxProps} from '@mui/material/styles';
import {useTranslation} from 'next-i18next';

interface Props {
  sx?: SxProps;
}

const FilterModalToggleBtn: React.FunctionComponent<Props> =
  function FilterModalToggleBtn(props) {
    const { isOpen, toggle } = useFiltersModal();
    const { t } = useTranslation('common');
    return (
      <Tooltip arrow title={t('More Filters')}>
        <IconButton
          sx={props.sx}
          onClick={() => {
            toggle();
          }}
        >
          {isOpen ? <FilterAltOutlinedIcon /> : <FilterAltIcon />}
        </IconButton>
      </Tooltip>
    );
  };

export default FilterModalToggleBtn;
