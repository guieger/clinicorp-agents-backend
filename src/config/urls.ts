export const API_URLS = {
  // URL base da API
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  
  // Endpoints de conversa
  CONVERSATION: {
    SEND_MESSAGE: '/api/conversation/message/send',
    DELETE_MESSAGE: '/api/conversation/message/delete',
  },
  
  // Endpoints de conta
  ACCOUNT: {
    GET_BY_TOKEN: (token: string) => `/api/account/${token}`,
    QR_CODE: (token: string) => `/api/account/instance/qrcode/${token}`,
    ACTIVATE_CHANNEL: '/api/account/channel/activate',
    CREATE_CHANNEL: '/api/account/channel/create',
    VINCULATE: '/api/account/vinculate',
    VINCULATED: (clientId: string) => `/api/account/vinculated?clientId=${clientId}`,
  },
} as const;

// Função helper para construir URLs completas
export const buildUrl = (endpoint: string): string => {
  return `${API_URLS.BASE_URL}${endpoint}`;
};

// Função helper para construir URLs com parâmetros
export const buildUrlWithParams = (endpoint: string, params: Record<string, string>): string => {
  const url = new URL(`${API_URLS.BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}; 