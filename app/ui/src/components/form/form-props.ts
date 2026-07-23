export interface FormProps<T> {
  id?: string;
  afterSave?: (formData: T) => void;
  onCancel?: () => void;
}
