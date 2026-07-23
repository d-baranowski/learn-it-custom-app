import React from 'react';
import IconButton from '@mui/material/IconButton';
import {GRID_TOKEN_SEARCH_PARAM} from '~/_lib/grid/grid';
import toast from 'react-hot-toast';
import ShareIcon from '@mui/icons-material/Share';
import Tooltip from '@mui/material/Tooltip';
import {SxProps} from '@mui/material/styles';
import useEncodedGridState from '~/_lib/grid/hooks/use-encodable-grid-state';
import {useTranslation} from 'next-i18next';

interface Props {
  sx?: SxProps;
}

const ShareBtn: React.FunctionComponent<Props> = function ShareBtn(props) {
  const { encoded } = useEncodedGridState();
  const { t } = useTranslation('common');
  return (
    <Tooltip arrow title={t('Share')}>
      <IconButton
        sx={props.sx}
        onClick={async () => {
          const url = new URL(document.URL);
          // TODO figure out why decoding the store only works when url is encoded
          //const urlWithoutQuery = url.origin + url.pathname + `?${GRID_TOKEN_SEARCH_PARAM}=` + store.encode;
          //console.log(urlWithoutQuery)
          //console.log(url.toString())

          url.searchParams.set(GRID_TOKEN_SEARCH_PARAM, encoded);

          await navigator.clipboard.writeText(url.toString());
          toast.success(t('Link copied to clipboard'));
        }}
      >
        <ShareIcon />
      </IconButton>
    </Tooltip>
  );
};

export default ShareBtn;
