export interface ValidationError {
  fieldPath: string,
  forKey: boolean,
  message: string,
  constraintID: string,
}

export interface ValidationResult {
  ok: boolean,
  errors: ValidationError[]
}
