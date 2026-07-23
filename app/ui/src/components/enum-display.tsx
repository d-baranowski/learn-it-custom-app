import {enums} from "@gen/enums";

export const EnumDisplay = (enumKey: keyof typeof enums, value: number) => {
  if (value == undefined) {
    return '';
  }

  const enumValues = enums[enumKey];
  const display = enumValues[value as keyof typeof enumValues];
  if (!display) {
    return '';
  }
  return display;
};

