import React from 'react';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/AddCircle';
import Tooltip from '@mui/material/Tooltip';
import {SxProps} from '@mui/material/styles';
import {useTranslation} from 'next-i18next';

interface Props {
  sx?: SxProps;
  onClick?: () => void;
}

const AddItemGridBtn: React.FunctionComponent<Props> = function AddItemGridBtn(
  props,
) {
  const { t } = useTranslation('common');

  return (
    <Tooltip arrow title={t('Add Item')}>
      <IconButton
        data-testid="add-item-grid-btn"
        color="primary"
        sx={props.sx}
        onClick={props.onClick}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AddItemGridBtn;
