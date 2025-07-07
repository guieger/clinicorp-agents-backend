export class PhoneUtils {
  /**
   * Normaliza um número de telefone brasileiro
   * Adiciona o dígito 9 quando necessário (para celulares)
   */
  static normalizeBrazilianNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('55')) {
      cleaned = cleaned.substring(2);
    }
  
    const ddd = cleaned.substring(0, 2);
    let rest = cleaned.substring(2);
  
    // Adiciona o 9 se tiver 8 dígitos (provavelmente esqueceram o 9)
    if (rest.length === 8) {
      rest = '9' + rest;
    }
  
    return '55' + ddd + rest;
  }
} 