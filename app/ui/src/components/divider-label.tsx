import React from 'react';
import {grey} from "@mui/material/colors";
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid';

interface Props extends React.PropsWithChildren {

}

const DividerLabel: React.FunctionComponent<Props> = function DividerLabel(props) {
  return (
    <Grid item xs={12}>
      <Typography sx={labelStyle}>
        {props.children}
      </Typography>
    </Grid>
  );
};

const labelStyle = {fontWeight: '600', color: grey[700], fontSize: "0.9em"};

export default DividerLabel;
