import { Solution, BirthdayData } from './solutionsCore';
import { BusinessError } from '../../utils/errors';

export class ClinicorpSolution implements Solution {
  private baseUrl = 'https://orion-40044274-solution-ij3amjrraq-ue.a.run.app';
  private username = 'caclinicorp';
  private password = 'd4dbaf1f-99e0-42f0-bed6-19771d6f164c';

  async getBirthdays(date: string, subscriberId: string): Promise<BirthdayData[]> {
    
    try {
      const url = `${this.baseUrl}/rest/v1/patient/birthdays?subscriber_id=${subscriberId}&date=${date}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.username}:${this.password}`).toString('base64'),
        }
      });
      
      if (!response.ok) {
        // Trata erros HTTP específicos
        if (response.status === 404) {
          throw new BusinessError('Endpoint não encontrado no serviço Clinicorp', 404);
        }
        if (response.status === 401) {
          throw new BusinessError('Acesso não autorizado ao serviço Clinicorp', 401);
        }
        if (response.status === 403) {
          throw new BusinessError('Acesso negado ao serviço Clinicorp', 403);
        }
        
        throw new BusinessError(`Erro ao buscar aniversariantes: ${response.status} ${response.statusText}`, response.status);
      }

      const data = await response.json();

      console.log('🔥 data >>:', data)
            // Valida se a resposta tem a estrutura esperada
      if (!data || !Array.isArray(data)) {
        throw new BusinessError('Resposta inválida do serviço Clinicorp', 500);
      }
      
      // Se não há aniversariantes, retorna array vazio (não é um erro)
      if (data.length === 0) {
        return [];
      }
      
      return data.map((patient: any) => ({
        PatientId: patient.PatientId,
        Name: patient.Name,
        BirthDate: patient.BirthDate,
        Email: patient.Email,
        MobilePhone: patient.MobilePhone,
        Age: patient.Age,
      }));
    } catch (error) {
      // Se já é um BusinessError, apenas propaga
      if (error instanceof BusinessError) {
        throw error;
      }
      
      // Se é um erro de rede ou outro tipo, converte para BusinessError
      console.error('Erro ao buscar aniversariantes:', error);
      throw new BusinessError(
        `Erro ao conectar com o serviço Clinicorp: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        500
      );
    }
  }
} 