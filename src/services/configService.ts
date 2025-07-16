import { ConfigCore } from "./configCore";
import { crud } from "../utils/crud";
import { BusinessError } from "../utils/errors";
import { Channel } from "@prisma/client";
import { httpService } from "./HttpService";
import { SchedulerService } from "./schedulerService";

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

    async getTemplateMessage(name: string = "Aniversariante", templateId: string, patient: any) {

        const template = await crud.findById('messageTemplates', templateId) as { Content: string };

        if(!template) {
            throw new BusinessError('Template não encontrado', 404);
        }

        const content = template.Content;

        const message = await this.renderTemplate(content, patient);

        return message;

    },

    async renderTemplate(template: string, data: any) {

        return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
          key = key.trim();
          return data.hasOwnProperty(key) ? data[key] : "";
        });
        
    },

    async saveConfig(params: {
        accountId: string;
        ActivityType: string;
        Active: boolean;
        ToneOfVoice?: string;
        DispatchHour?: number;
        DispatchMinute?: number;
        TemplateType?: string;
        HasFollowUp?: boolean;
        FollowUpDelayHours?: number;
        TemplateId?: string;
    }) {
        try {
            const {
                accountId,
                ActivityType,
                Active,
                ToneOfVoice,
                DispatchHour,
                DispatchMinute,
                TemplateType,
                HasFollowUp,
                FollowUpDelayHours,
                TemplateId
            } = params;

            console.log('🔥 params >>:', params)

            // Verifica se a conta existe
            const account = await crud.findById('account', accountId);
            if (!account) {
                throw new BusinessError('Conta não encontrada', 404);
            }

            // Verifica se já existe uma configuração para esta conta e tipo de atividade
            const existingConfig = await crud.findFirst('config', {
                AccountId: accountId,
                ActivityType: ActivityType
            }) as { Id: string, DispatchHour?: number } | null;

            const configData = {
                ActivityType,
                Active: Active ? 1 : 0,
                ToneOfVoice,
                DispatchHour,
                DispatchMinute,
                TemplateType,
                AccountId: accountId,
                HasFollowUp: HasFollowUp ? 1 : 0,
                FollowUpDelayHours,
                TemplateId
            };

            // Gerencia jobs do scheduler ANTES de salvar a configuração
            await SchedulerService.manageActivityJob({
                accountId,
                activityType: ActivityType,
                active: Active,
                dispatchHour: DispatchHour,
                dispatchMinute: DispatchMinute
            });

            let result;
            if (existingConfig) {
                // Atualiza configuração existente
                result = await crud.update('config', existingConfig.Id, configData);
            } else {
                // Cria nova configuração
                result = await crud.create('config', configData);
            }
            
            return {
                config: result,
                message: existingConfig ? 'Configuração atualizada com sucesso' : 'Configuração criada com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao salvar configuração:', error);
            throw error;
        }
    },

    async getActivities(accountId: string, select?: any) {
        const activities = await crud.findMany('config', { AccountId: accountId }, select);
        return activities;
    },

    async getActivity(accountId: string, activityType: string, select?: any) {
        const activity = await crud.findFirst('config', { AccountId: accountId, ActivityType: activityType }, select);
        return activity;
    },

    async getTemplates(accountId: string) {
        const templates = await crud.findMany('messageTemplates', { AccountId: accountId });
        return templates;
    },


}
