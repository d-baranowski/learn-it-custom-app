import React from 'react';
import {enumKeys, enums} from "@gen/enums";
import {useTranslation} from 'next-i18next';

interface EnumRendererProps {
  enumKey: enumKeys,
  value: number;
}

const EnumRenderer: React.FC<EnumRendererProps> = ({enumKey, value}) => {
  const display = useEnumDisplay(enumKey, value);
  return (
    <span>{display}</span>
  );
};

export const useEnumDisplay = (enumKey: enumKeys, value: number) => {
  const {t} = useTranslation('common');
  if (value === undefined) {
    return '';
  }
  const enumValues = enums[enumKey];
  const display = enumValues[value as keyof typeof enumValues];
  if (!display) {
    return 'Not Set';
  }
  return t(display);
}


export default EnumRenderer;
