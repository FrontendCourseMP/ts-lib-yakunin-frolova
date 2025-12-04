export interface ValiGuardOptions {
  suppressWarnings?: boolean;
}

export interface ValiGuardMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  number?: string;
  min?: string;
  max?: string;
  minItems?: string;
  maxItems?: string;
  custom?: string;
}

export interface ValiGuardRules {
  required?: boolean;
  type?: 'string' | 'number' | 'array' | string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minItems?: number;
  maxItems?: number;
  validator?: (value: unknown, ctx: { name: string; field: unknown }) => boolean | string;
  messages?: ValiGuardMessages;
}

export interface ValiGuardResult {
  isValid: boolean;
  errors: Record<string, string | null>;
}

export default class ValiGuard {
  constructor(form: HTMLFormElement, options?: ValiGuardOptions);
  addField(name: string, rules: ValiGuardRules): void;
  validate(): ValiGuardResult;
}


