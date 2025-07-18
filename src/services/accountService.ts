import { prisma } from '../config/database';

export interface Account {
  Id: string;
  Name: string;
  PhoneNumber: string;
  IsActive: boolean;
  CreatedAt: Date;
  IsConnected: boolean;
  ConversationToken: string | null;
  ExternalSubscriberId: string | null;
}

export class AccountService {
  /**
   * Verifica se uma account existe e está ativa na base de dados
   * @param accountId - ID da account a ser verificada
   * @returns Promise<Account | null> - Retorna a account se existir e estiver ativa, null caso contrário
   */
  static async verifyAccountExists(accountId: string): Promise<Account | null> {
    try {
      const account = await prisma.account.findUnique({
        where: {
          Id: accountId
        },
        select: {
          Id: true,
          Name: true,
          PhoneNumber: true,
          IsActive: true,
          CreatedAt: true,
          IsConnected: true,
          ConversationToken: true,
          ExternalSubscriberId: true
        }
      });

      // Retorna a account apenas se ela existir e estiver ativa
      return account && account.IsActive ? account : null;
    } catch (error) {
      console.error('Erro ao verificar account:', error);
      return null;
    }
  }

  /**
   * Busca uma account por ID sem verificar se está ativa
   * @param accountId - ID da account
   * @returns Promise<Account | null>
   */
  static async findAccountById(accountId: string): Promise<Account | null> {
    try {
      const account = await prisma.account.findUnique({
        where: {
          Id: accountId
        },
        select: {
          Id: true,
          Name: true,
          PhoneNumber: true,
          IsActive: true,
          CreatedAt: true,
          IsConnected: true,
          ConversationToken: true,
          ExternalSubscriberId: true
        }
      });

      return account;
    } catch (error) {
      console.error('Erro ao buscar account:', error);
      return null;
    }
  }

  /**
   * Lista todas as accounts ativas
   * @returns Promise<Account[]>
   */
  static async listActiveAccounts(): Promise<Account[]> {
    try {
      const accounts = await prisma.account.findMany({
        where: {
          IsActive: true
        },
        select: {
          Id: true,
          Name: true,
          PhoneNumber: true,
          IsActive: true,
          CreatedAt: true,
          IsConnected: true,
          ConversationToken: true,
          ExternalSubscriberId: true
        },
        orderBy: {
          CreatedAt: 'desc'
        }
      });

      return accounts;
    } catch (error) {
      console.error('Erro ao listar accounts:', error);
      return [];
    }
  }

  /**
   * Cria uma nova account
   * @param accountData - Dados da account a ser criada
   * @returns Promise<Account>
   */
  static async createAccount(accountData: {
    Name: string;
    PhoneNumber: string;
    IsActive?: boolean;
  }): Promise<Account> {
    try {
      const account = await prisma.account.create({
        data: {
          ...accountData,
          IsActive: accountData.IsActive ?? true,
          CreatedAt: new Date(),
          IsConnected: false
        },
        select: {
          Id: true,
          Name: true,
          PhoneNumber: true,
          IsActive: true,
          CreatedAt: true,
          IsConnected: true,
          ConversationToken: true,
          ExternalSubscriberId: true
        }
      });

      return account;
    } catch (error) {
      console.error('Erro ao criar account:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de conexão de uma account
   * @param accountId - ID da account
   * @param isConnected - Status de conexão
   * @returns Promise<Account | null>
   */
  static async updateConnectionStatus(accountId: string, isConnected: boolean): Promise<Account | null> {
    try {
      const account = await prisma.account.update({
        where: {
          Id: accountId
        },
        data: {
          IsConnected: isConnected
        },
        select: {
          Id: true,
          Name: true,
          PhoneNumber: true,
          IsActive: true,
          CreatedAt: true,
          IsConnected: true,
          ConversationToken: true,
          ExternalSubscriberId: true
        }
      });

      return account;
    } catch (error) {
      console.error('Erro ao atualizar status de conexão:', error);
      return null;
    }
  }
}
