import Grid from '@mui/material/Grid';
import React from 'react';
import {SxProps, Theme} from '@mui/material/styles';

interface Props extends React.PropsWithChildren {
  xs?: number
  gridSx?: SxProps<Theme>;
  bare?: boolean
  hide?: boolean
}

// Allows to coditionally unwrap the child from the grid component
const BareGridItem: React.FunctionComponent<Props> = function BareGridItem(props) {
  const { xs  = 6 } = props;

  if (props.hide) {
    return null;
  }

  if (props.bare) {
    return <>{props.children}</>
  }
  return (
    <Grid item xs={xs} sx={props.gridSx}>
      {props.children}
    </Grid>
  );
};

export default BareGridItem;
