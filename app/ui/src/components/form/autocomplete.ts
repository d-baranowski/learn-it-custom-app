export type AutoCompleteIDType = string | number;

export interface AutoCompleteOption<T extends AutoCompleteIDType> {
  id: T,
  label: string;
}

export const isOptionEqualToValue = <T extends AutoCompleteIDType>(
  option: AutoCompleteOption<T>,
  value: AutoCompleteOption<T>
): boolean => {
  if (!option || !value) {
    return false;
  }
  return option.id === value.id;
}