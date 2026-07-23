export type IAutocompleteOption = {
  id: string | null;
  name: string;
}

export type onChangeHandler = {
  onChange: (value: any) => void;
  helperText?: string;
}