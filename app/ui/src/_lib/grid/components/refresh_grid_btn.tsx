import React from 'react';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import {SxProps} from '@mui/material/styles';
import {useTranslation} from 'next-i18next';

interface Props {
  sx?: SxProps;
  refetch: () => void;
  isFetching?: boolean;
}

const RefreshGridBtn: React.FunctionComponent<Props> = function RefreshGridBtn(
  props,
) {
  const { t } = useTranslation('common');

  return (
    <Tooltip arrow title={t('Refresh Data')}>
      <span>
        <IconButton
          sx={props.sx}
          onClick={props.refetch}
          disabled={props.isFetching}
          data-testid="refresh-grid-btn"
        >
          <RefreshIcon
            sx={{
              '@keyframes refresh-grid-spin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
              },
              animation: props.isFetching
                ? 'refresh-grid-spin 0.8s linear infinite'
                : 'none',
            }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default RefreshGridBtn;
