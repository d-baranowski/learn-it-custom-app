import React from 'react';
import IconButton from '@mui/material/IconButton';
import DangerIcon from '@mui/icons-material/Dangerous';
import Tooltip from '@mui/material/Tooltip';
import {SxProps} from '@mui/material/styles';
import useGridReset from '../hooks/use-grid-reset';
import {useTranslation} from 'next-i18next';

interface Props {
  sx?: SxProps;
}

const ResetGridBtn: React.FunctionComponent<Props> = function ResetGridBtn(
  props,
) {
  const { reset } = useGridReset();
  const { t } = useTranslation('common');
  return (
    <Tooltip arrow title={t('Reset Grid')}>
      <IconButton sx={props.sx} onClick={() => reset()}>
        <DangerIcon />
      </IconButton>
    </Tooltip>
  );
};

export default ResetGridBtn;
