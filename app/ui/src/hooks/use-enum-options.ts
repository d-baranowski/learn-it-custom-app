import { enumKeys, enums } from '@gen/enums';
import { useMemo } from 'react';
import { useTranslation } from 'next-i18next';

export interface EnumOption {
  id: number;
  label: string;
}

type enumFilter = (key: string, index: number, array: string[]) => boolean;

function useEnumOptions(
  enumKey: enumKeys,
  filter: enumFilter = () => true,
  sortByLabel: boolean = true,
): EnumOption[] {
  const { t } = useTranslation('common');
  return useMemo(() => {
    const enumValues = enums[enumKey];
    const opts: EnumOption[] = Object.keys(enumValues)
      .filter(filter)
      .map((key, _) => {
        return {
          id: parseInt(key),
          label:
            t(enumValues[key as unknown as keyof typeof enumValues]) ??
            'Unknown',
        };
      });

    if (sortByLabel) {
      // sort opts by label
      opts.sort((a, b) => a.label.localeCompare(b.label));
    }

    return opts;
  }, [filter, enumKey, sortByLabel, t]);
}

export default useEnumOptions;
