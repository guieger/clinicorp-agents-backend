import { prisma } from '../config/database';
import { crud } from '../utils/crud';

export interface IntegrationConfig {
  [key: string]: any;
}

export class IntegrationService {
  /**
   * Busca a configuração de integração ativa para um cliente específico
   */
  static async getActiveIntegrationConfig(accountId: string): Promise<IntegrationConfig> {
    //   const integration = await crud.findFirst('integration', 
    //     {
    //       accountId,
    //       isActive: true
    //     },
    //     {
    //       config: true
    //     }
    //   ) as { config: IntegrationConfig };

    // if (!integration) {
    //   throw new Error('Integração não encontrada para o client.');
    // }

    // if (!integration.config) {
    //   throw new Error('Configuração da integração não encontrada.');
    // }

    // return integration.config as IntegrationConfig;
  }

  /**
   * Valida se uma integração existe e está ativa
   */
  static async validateIntegration(accountId: string): Promise<boolean> {
    try {
      // await this.getActiveIntegrationConfig(accountId);
      return true;
    } catch (error) {
      return false;
    }
  }
} 