import Chip from "@mui/material/Chip";
import React from "react";

export const ChipCell = (value: string[]) => {
  if (!value) {
    return <></>;
  }

  return (
    <>
      {value.map((v, i) => (
        <Chip key={i} label={v} />
      ))}
    </>
  );
}
