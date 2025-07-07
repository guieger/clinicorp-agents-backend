import { crud } from '../../utils/crud';

export const ConversationService = {

  async saveMessage(params: { 
    accountId: string, 
    phone: string, 
    message: string,
    sender: string
  }) {

    const {accountId, phone, message, sender} = params;

    try {
        // Normaliza os números de telefone caso necessário. Não é necessário para o momento. PhoneUtils.normalizeBrazilianNumber
        const normalizedPhone = phone;

        const conversation = await crud.findFirst('conversations', {
            AccountId: accountId,
            PatientPhone: normalizedPhone
        }) as { Id: string };

        if (!conversation) {

            const newConversation = await crud.create('conversations', {
                AccountId: accountId,
                PatientPhone: normalizedPhone,
                Channel: "whatsapp",
                PatientName: "teste",
                Status: "open",
                StartedAt: new Date(),
                LastMessageAt: new Date()
            }) as { Id: string };

            const conversationId = newConversation.Id;

            if (!conversationId) {
                throw new Error('Erro ao criar conversa');
            }

            const newMessage = await crud.create('message', {
                ConversationId: conversationId,
                Content: message,
                Sender: sender,
                Type: "text",
                Status: "created",
                Timestamp: new Date(),
                PatientName: "teste",
            }) as { Id: string };


            return {
                success: true,
                data: {
                    conversationId: conversationId,
                    messageId: newMessage.Id
                }
            }


        } else {
            
            const conversationId = conversation.Id;

            if (!conversationId) {
                throw new Error('Erro ao criar conversa');
            }

            const newMessage = await crud.create('message', {   
                ConversationId: conversationId,
                Content: message,
                Sender: sender,
                Type: "text",
                Status: "sent",
                Timestamp: new Date(),
                PatientName: "teste",
            }) as { Id: string };

            return {
                success: true,
                data: {
                    conversationId: conversationId,
                    messageId: newMessage.Id
                }
            }
            
        }

    } catch (error) {
        throw error;
    }


  },

  async handleExternalSaveMessage(params: { 
    patientPhone: string, 
    message: string,
    sender: string,
    clientPhone: string,
    senderName: string
  }) {

    const {patientPhone, message, sender, clientPhone, senderName} = params;

    try {
        // Normaliza os números de telefone caso necessário. Não é necessário para o momento. PhoneUtils.normalizeBrazilianNumber
        const normalizedClientPhone = clientPhone;
        const normalizedPatientPhone = patientPhone;

        const client = await crud.findFirst('account', {
            PhoneNumber: normalizedClientPhone
        }) as { Id: string };

        if (!client) {
            throw new Error('Cliente não encontrado');
        }

        console.log('🔥 client >>:', client)
        console.log('🔥 normalizedPatientPhone >>:', normalizedPatientPhone)

        const conversation = await crud.findFirst('conversations', {
            AccountId: client.Id,
            PatientPhone: normalizedPatientPhone
        }) as { Id: string };

        if (!conversation) {
            throw new Error('Conversa não encontrada');
        }


        console.log('🔥 message >>:', message)
        
        const newMessage = await crud.create('message', {
            ConversationId: conversation.Id,
            Content: message,
            Sender: sender,
            Type: "text",
            Status: "sent",
            Timestamp: new Date(),
            PatientName: senderName,
        }) as { Id: string };

        return {
            success: true,
            data: {
                conversationId: conversation.Id,
                messageId: newMessage.Id
            }
        }
    } catch (error) {
        console.error('❌ Erro ao salvar mensagem:', error)
        return {
            success: false,
            message: 'Erro ao salvar mensagem externa',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
    }

  },

  async listConversation(accountId: string) {

    try {

        const conversations = await crud.findMany('conversations', {
            AccountId: accountId,
        });  

        return conversations;
        
    } catch (error) {
        console.error('❌ Erro ao listar conversas:', error)
        throw error;
    }
  },

  async listMessages(params: {
    accountId: string
  }) {

    try {
        const {accountId} = params;

        const conversation = await crud.findFirst('conversations', {
            AccountId: accountId,
        }) as { Id: string };

        if (!conversation) {
            throw new Error('Conversa não encontrada');
        }

        const messages = await crud.findMany('message', {
            ConversationId: conversation.Id,
        }, undefined, {
            Timestamp: 'asc'
        });

        return messages;

    } catch (error) {
        console.error('❌ Erro ao listar mensagens:', error)
        throw error;
    }
  },

  async sendMessage(params: {
    accountId: string,
    phone: string,
    message: string,
    sender: string,
    messageId: string
  }) {
    const {accountId, phone, message, sender, messageId} = params;
    const conversationToken = "1690b0aa201068570c8661224cbf8d7f3783523ef4e634fb357c64989b867821";

    try {
        const warpMessageResponse = await fetch('http://localhost:3000/api/conversation/message/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${conversationToken}`
            },
            body: JSON.stringify({ payload: { message, phone, messageId, accountId } }),
          });

        if (!warpMessageResponse.ok) {
            throw new Error('Erro ao enviar mensagem para warpMessage');
        }

        const data = await warpMessageResponse.json();

        return data;
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
        throw error;
    }
  },

  async updateMessage(messageId: string, updateData: { ExternalId?: string; Status?: string }){
    try {
        const updatedMessage = await crud.update('message', messageId, updateData);
        return updatedMessage;
    } catch (error) { 
        console.error('❌ Erro ao atualizar mensagem:', error)
        throw error;
    }
  },

  async updateMessageByExternalId(params: {
    externalId: string,
    updateData: { Status?: string; [key: string]: any }
  }){
    const { externalId, updateData } = params;

    try {
        // Primeiro encontra a mensagem pelo ID externo
        const message = await crud.findFirst('message', {
            ExternalId: externalId
        }) as { Id: string };

        if (!message) {
            throw new Error('Mensagem não encontrada com o ID externo fornecido');
        }

        // Depois atualiza usando o ID interno
        const updatedMessage = await crud.update('message', message.Id, updateData);
        return updatedMessage;
    } catch (error) {
        console.error('❌ Erro ao atualizar mensagem por ID externo:', error)
        throw error;
    }
  },

  async updateMessagesByCriteria(where: any, updateData: { Status?: string; [key: string]: any }){
    try {
        const result = await crud.updateWhere('message', where, updateData);
        return result;
    } catch (error) {
        console.error('❌ Erro ao atualizar mensagens por critérios:', error)
        throw error;
    }
  },

  async handleSendMessage(params: {
    accountId: string,
    phone: string,
    message: string,
    sender: string
  }) {
    const { accountId, phone, message, sender } = params;

    try {
      // Salva a mensagem no banco de dados
      const saveMessageResponse = await this.saveMessage({ 
        accountId, 
        phone, 
        message, 
        sender 
      });
      
      console.log('🔥 saveMessageResponse:', saveMessageResponse);
      
      const { messageId } = saveMessageResponse.data as { messageId: string };
      console.log('✅ Mensagem salva no banco com sucesso', messageId);

      // Envia a mensagem para o serviço externo

      try {
        const warpSendMessageResponse = await this.sendMessage({
          accountId,
          phone,
          message,
          sender,
          messageId
        });

        const data = warpSendMessageResponse;

        await this.updateMessage(messageId, { 
          ExternalId: data.id, 
          Status: "sent" 
        });

        console.log('🔥 warpSendMessageResponse:', warpSendMessageResponse);

        return {
            messageId,
            externalId: data.id,
            conversationId: saveMessageResponse.data.conversationId
          };

      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
        await this.updateMessage(messageId, { Status: "failed" });
        throw error;
      }


    } catch (error) {
      console.error('❌ Erro ao processar envio de mensagem:', error);
      throw error;
    }
  }
}