import React from 'react';
import {enumKeys, enums} from "@gen/enums";

interface Props {
  enumKey: enumKeys,
  values: number[];
}

const EnumArrayRenderer: React.FC<Props> = ({enumKey, values}) => {
  let display = ""

  if (values) {
    display = values
      .map((value) => getEnumDisplay(enumKey, value))
      .join(", ")
  }

  return (
    <span>{display}</span>
  );
};

export const getEnumDisplay = (enumKey: enumKeys, value: number) => {
  const enumValues = enums[enumKey];
  const display = enumValues[value as keyof typeof enumValues];
  if (!display) {
    return 'Not Set';
  }
  return display;
}


export default EnumArrayRenderer;
