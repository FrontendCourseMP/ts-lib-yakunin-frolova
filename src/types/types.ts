// export type sum = (a: number, b: number) => number
export interface ValidationRule {
  rule: 'required' | 'minLength' | 'maxLength' | 'email' | 'pattern' | string;
  value?: string;
  errorMessage?: string;
}

export interface FieldConfig {
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  rules: ValidationRule[];
}

export interface ValiGuardConfig {
  autoValidate?: boolean;
}