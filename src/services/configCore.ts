import { BusinessError } from "../utils/errors";
import { httpService } from "./HttpService";

    interface QrcodeImageResponse {
    token: string;
}

export const ConfigCore = {

    async getQrcodeImage(clientToken: string): Promise<QrcodeImageResponse> {


        try {
            const response = await httpService.getQrCode(clientToken);
            
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao obter o QRCode:', error)
            throw error;
        }

        // try {   
        //     const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/qr-code/image`,{
        //         method: 'GET',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Client-Token': clientToken
        //         }   
        //     });
        //     const data = await response.json();

        //     if (response.status !== 200) {
        //         throw new Error('Erro ao obter o QRCode: ' + response.statusText);
        //     }

        //     return data;
        // } catch (error) {
        //     console.error('❌ Erro ao obter o QRCode:', error)
        //     throw error;
        // }
    },

    async getPhoneCode(instanceId: string, instanceToken: string, clientToken: string, phone: string) {
        console.log('🔥 instanceId >>:', instanceId)
        console.log('🔥 instanceToken >>:', instanceToken)
        console.log('🔥 clientToken >>:', clientToken)
        console.log('🔥 phone >>:', phone)

        try {
            const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/phone-code/${phone}`,{
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-Token': clientToken
                }   
            });

            const data = await response.json();

            if (response.status !== 200) {
                throw new Error('Erro ao obter o código de verificação: ' + response.statusText);
            }

            console.log('🔥 data >>:', data)

            return data;
        } catch (error) {
            console.error('❌ Erro ao obter o código de verificação:', error)
            throw error;
        }
    },

    async activateWhatsappChannel(clientToken: string, channelName: string) {
        console.log('🔥 clientToken >>:', clientToken)
        console.log('🔥 channelName >>:', channelName)
        
        try {
            const response = await httpService.activateChannel({
                clientToken: clientToken,
                channelName: channelName
            });
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao ativar canal:', error)
            throw error;
        }
    },

    async createChannel(conversationToken: string, channelName: string) {
        console.log('🔥 conversationToken >>:', conversationToken)
        console.log('🔥 channelName >>:', channelName)

        try {
            const response = await httpService.createChannel({
                conversationToken: conversationToken,
                channelName: channelName
            });

            return response.data;
        } catch (error) {
            console.error('❌ Erro ao criar canal:', error)
            throw error;
        }
    },

    async vinculateConversation(conversationToken: string, accountId: string) {
        console.log('🔥 conversationToken >>:', conversationToken)
        console.log('🔥 accountId >>:', accountId)

        try {
            const response = await httpService.vinculate({
                conversationToken: conversationToken,
                accountId: accountId
            });

            if (!response.ok) {
                throw new BusinessError('Erro ao vincular conta', response.status);
            }

            return response.data;
        } catch (error) {
            console.error('❌ Erro ao vincular conversa:', error)
            throw new Error('Erro ao vincular conta: ' + error);
        }
    },
    
    async verifyVinculateConversation(conversationToken: string, accountId: string) {
        console.log('🔥 conversationToken >>:', conversationToken)
        console.log('🔥 accountId >>:', accountId)

        try {
            const response = await httpService.getVinculated(accountId);
            return response.data;
        } catch (error) {   
            console.error('❌ Erro ao verificar vinculação de conta:', error)
            throw error;
        }
    }
}

