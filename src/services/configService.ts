import { ConfigCore } from "./configCore";
import { crud } from "../utils/crud";
import { BusinessError } from "../utils/errors";
import { Channel } from "@prisma/client";
import { httpService } from "./HttpService";

interface Account {
    Id: string;
    Name: string;
    ConversationToken: string;
}

export const ConfigService = {

    async getQrcodeImage(accountId: string) {

        const account = await crud.findById('account', accountId) as Account;

        const qrcode = await ConfigCore.getQrcodeImage(account.ConversationToken);

        return qrcode;

    },

    async getPhoneCode(accountId: string, phone: string) {

        // const integration = await crud.findFirst('integration', {
        //     accountId: accountId,
        // }) as Integration;

        // if (!integration) {
        //     throw new Error('Integração não encontrada');
        // }

        try {
            //  const config = integration.config as IntegrationConfig;
            // const phoneCode = await ConfigCore.getPhoneCode(config.InstanceId, config.InstanceToken,config.ClientToken, phone);

            return {
                phoneCode: 'TO DO'
            }
        } catch (error) {
            console.error('❌ Erro ao obter o código de verificação:', error)
            throw error;
        }
    },

    async createAccount(name: string) {

        try {
            const account = await crud.create('account', {
                Name: name,
            }) as Account;

            return account;
        } catch (error) {
            console.error('❌ Erro ao criar conta:', error)
            throw error;
        }
    },

    async getAccount(accountId: string) {
        const account = await crud.findById('account', accountId) as Account;

        try {
        if (!account) {
            throw new BusinessError('Conta não encontrada', 404);
        }
        
        const clientToken = account.ConversationToken;

        const response = await httpService.getAccountByToken(clientToken);

        if (!response.ok) {
            throw new BusinessError('Erro ao buscar conta', response.status);
        }

        return {
            name: account.Name,
            conversationToken: account.ConversationToken,
        };
        } catch (error) {
            console.error('❌ Erro ao buscar conta:', error)
            throw error;
        }
    },

    async createChannel(conversationToken: string, channelName: string) {

        const channel = await ConfigCore.createChannel(conversationToken, channelName);

        return channel;
    },

    async getWhatsappChannel(accountId: string) {
        const channel = await crud.findFirst('channel', 
            { AccountId: accountId },
            {
                Id: true,
                Name: true,
                IsConnected: true,
                ActivationDate: true,
            }
        ) as Channel;

        if (!channel) {
            throw new BusinessError('Canal não encontrado', 404);
        }

        return {
            id: channel.Id,
            name: channel.Name,
            isConnected: channel.IsConnected,
        };
    },

    async activateWhatsappChannel(accountId: string, channelId: string) {

        const account = await crud.findById('account', accountId) as Account;

        if (!account) {
            throw new BusinessError('Conta não encontrada', 404);
        }

        const conversationChannel = await ConfigCore.activateWhatsappChannel(account.ConversationToken, channelId); 

        const channel = await crud.update('channel', channelId, { IsConnected: true }) as Channel;

        if (!channel) {
            throw new BusinessError('Erro ao ativar canal', 500);
        }

        return {
            id: channel.Id,
            name: channel.Name,
            isConnected: channel.IsConnected,
        };
    },

    async vinculateConversation(accountId: string) {

        console.log('🔥 accountId >>:', accountId)

        try {
            const account = await crud.findById('account', accountId) as Account;

            console.log('🔥 account >>:', account)

            if (!account) {
                throw new BusinessError('Conta não encontrada', 404);
            }

            const conversationAccount = await ConfigCore.vinculateConversation(account.ConversationToken, account.Id);

            return conversationAccount;
        } catch (error) {
            console.error('❌ Erro ao vincular conta:', error)
            throw error;
        }
        
    },

    async verifyVinculatedConversation(accountId: string) {   

        try {

            const account = await crud.findById('account', accountId) as Account;

            if (!account) {
                throw new BusinessError('Conta não encontrada', 404);
            }

            console.log('🔥 account >>:', account)

            const conversationAccount = await ConfigCore.verifyVinculateConversation(account.ConversationToken, account.Id);

            return conversationAccount;
        } catch (error) {
            console.error('❌ Erro ao verificar vinculação de conta:', error)
            throw error;
        }
    },

    async getTemplateMessage(accountId: string) {
        const account = await crud.findById('account', accountId) as Account;
        // return account.TemplateMessage;
        return (`Olá, ${account.Name}! Feliz aniversário. Que a saúde, o bem-estar e a alegria estejam presentes em todos os dias do seu novo ciclo.
            A Clínica Exemplo agradece por sua confiança e se sente honrada por fazer parte da sua história. E em comemoração ao seu aniversário, você ganhou um benefício especial para utilizar nos próximos 30 dias.
            Quando quiser utilizar, é só responder essa mensagem que te explicaremos melhor.
            Conte conosco para continuar cuidando de você com carinho e dedicação!`);
    }


}
