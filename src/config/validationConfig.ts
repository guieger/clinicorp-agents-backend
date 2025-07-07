export interface ValidationField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  message?: string;
}

export const MESSAGE_VALIDATION_FIELDS: ValidationField[] = [
  {
    name: 'message',
    type: 'string',
    required: true,
    message: 'Campo message é obrigatório e deve ser uma string'
  },
  {
    name: 'phone',
    type: 'string',
    required: true,
    message: 'Campo phone é obrigatório e deve ser uma string'
  }
];

export const getValidationMessage = (fieldName: string): string => {
  const field = MESSAGE_VALIDATION_FIELDS.find(f => f.name === fieldName);
  return field?.message || `Campo ${fieldName} é obrigatório`;
}; 