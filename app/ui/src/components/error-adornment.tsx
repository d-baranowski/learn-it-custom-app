import React from 'react';
import Tooltip from "@mui/material/Tooltip";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InputAdornment from "@mui/material/InputAdornment";

interface Props {
  title?: string;
}

const ErrorAdornment: React.FunctionComponent<Props> = function ErrorAdornment(props) {
  return (
    <InputAdornment position={"end"}><Tooltip title={props.title}><ErrorOutlineIcon /></Tooltip></InputAdornment>
  );
};

export default ErrorAdornment;
