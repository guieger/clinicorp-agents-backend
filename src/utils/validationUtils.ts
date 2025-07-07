import { ValidationField } from '../config/validationConfig';

export const validateField = (value: any, field: ValidationField): string | null => {
  // Verificar se campo é obrigatório
  if (field.required && (!value || value === '')) {
    return field.message || `Campo ${field.name} é obrigatório`;
  }

  // Verificar tipo se valor existe
  if (value !== undefined && value !== null) {
    switch (field.type) {
      case 'string':
        if (typeof value !== 'string') {
          return field.message || `Campo ${field.name} deve ser uma string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          return field.message || `Campo ${field.name} deve ser um número`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return field.message || `Campo ${field.name} deve ser um boolean`;
        }
        break;
    }
  }

  return null; // Campo válido
};

export const validatePayload = (body: any, fields: ValidationField[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Verificar se body existe
  if (!body) {
    return { isValid: false, errors: ['Payload não fornecido'] };
  }

  // Validar cada campo
  fields.forEach(field => {
    const error = validateField(body[field.name], field);
    if (error) {
      errors.push(error);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}; 