import React from 'react';
import IconButton from '@mui/material/IconButton';
import {DeletedState} from '@gen/request/v1/base_pb';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Tooltip from '@mui/material/Tooltip';
import {SxProps} from '@mui/material/styles';
import useDeletedState from '../hooks/use-deleted-state';
import {useTranslation} from 'next-i18next';

interface Props {
  sx?: SxProps;
}

const DeletedStateToggleBtn: React.FunctionComponent<Props> =
  function DeletedStateToggleBtn(props) {
    const { state, toggle } = useDeletedState();
    const { t } = useTranslation('common');

    let tooltipExtra = '';
    if (state === DeletedState.DS_ALL) {
      tooltipExtra = '- Current: Showing All';
    } else if (state === DeletedState.DS_ONLY_DELETED) {
      tooltipExtra = '- Current: Showing Only Deleted';
    }

    return (
      <Tooltip arrow title={t(`Toggle Show Deleted ${tooltipExtra}`)}>
        <IconButton
          sx={props.sx}
          onClick={() => {
            toggle();
          }}
        >
          {state === DeletedState.DS_NOT_DELETED ? (
            <DeleteSweepOutlinedIcon />
          ) : (
            <DeleteSweepIcon />
          )}
        </IconButton>
      </Tooltip>
    );
  };

export default DeletedStateToggleBtn;
