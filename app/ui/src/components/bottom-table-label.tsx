import React from 'react';
import {useTheme} from "@mui/material/styles";
import Typography from "@mui/material/Typography";

interface Props extends React.PropsWithChildren {}

const BottomTableLabel: React.FunctionComponent<Props> = function BottomTableLabel(props) {
  const theme = useTheme();

  return (
    <Typography sx={{ position: "absolute", top: theme.spacing(3), left: theme.spacing(2), color: theme.palette.grey[700] }}>{props.children}</Typography>
  );
};

export default BottomTableLabel;
