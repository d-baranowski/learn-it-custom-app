import React from "react";

export const YesNoCellRenderer = (value: boolean, withNo?: boolean) => {
  if (!withNo) {
    withNo = false;
  }

  if (value === null || value === undefined) {
    if (withNo) {
      return <>No</>;
    }
    return <></>;
  }

  if (!value) {
    if (withNo) {
      return <>No</>;
    }
    return <></>;
  }

  return <>Yes</>;
}
