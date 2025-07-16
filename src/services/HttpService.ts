import { API_URLS, buildUrl } from '../config/urls';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

interface HttpResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

export class HttpService {
  private static instance: HttpService;
  private baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  private constructor() {}

  public static getInstance(): HttpService {
    if (!HttpService.instance) {
      HttpService.instance = new HttpService();
    }
    return HttpService.instance;
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      token
    } = options;

    const url = buildUrl(endpoint);
    
    const requestHeaders = {
      ...this.baseHeaders,
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      return {
        data,
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      console.error(`❌ Erro na requisição HTTP para ${url}:`, error);
      throw error;
    }
  }

  // Métodos específicos para conversa
  async sendMessage(payload: any, token: string): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.CONVERSATION.SEND_MESSAGE, {
      method: 'POST',
      body: { payload },
      token,
    });
  }

  async deleteMessage(payload: any, token: string): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.CONVERSATION.DELETE_MESSAGE, {
      method: 'DELETE',
      body: payload,
      token,
    });
  }

  // Métodos específicos para conta
  async getAccountByToken(token: string): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.ACCOUNT.GET_BY_TOKEN(token));
  }

  async getQrCode(token: string): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.ACCOUNT.QR_CODE(token), {
      method: 'GET',
      headers: {
        'Client-Token': token
      }
    });
  }

  async activateChannel(payload: any): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.ACCOUNT.ACTIVATE_CHANNEL, {
      method: 'POST',
      body: payload,
    });
  }

  async createChannel(payload: any): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.ACCOUNT.CREATE_CHANNEL, {
      method: 'POST',
      body: payload,
    });
  }

  async vinculate(payload: any): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.ACCOUNT.VINCULATE, {
      method: 'POST',
      body: payload,
    });
  }

  async getVinculated(clientId: string): Promise<HttpResponse> {
    return this.makeRequest(API_URLS.ACCOUNT.VINCULATED(clientId));
  }

  // Método genérico para requisições customizadas
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(endpoint, options);
  }
}

// Exporta uma instância singleton
export const httpService = HttpService.getInstance(); 