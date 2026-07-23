/**
 * Auto-label helper for field components.
 *
 * Mirrors `~/hooks/use-form-element-label`: if a label is provided, translates
 * it; otherwise uses `capitalCase(name)` and translates that. Lets callers
 * write `<StringFe name="displayName" />` and get a "Display Name" label
 * for free.
 */

import { useMemo } from 'react';
import { capitalCase } from 'change-case';
import { useTranslation } from 'next-i18next';

export function useDefaultLabel(name: string, explicit?: string): string {
  const { t } = useTranslation('common');
  return useMemo(
    () => t(explicit ?? capitalCase(name)),
    [name, explicit, t]
  );
}
