import { crud } from '../utils/crud';
import { httpService } from './HttpService';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { uploadAudio, generateSignedUrl } from '../utils/googleGcpUtils';
import { processMessage } from '../lib/agents/agentsSDK';

// Função para verificar se o tipo de mensagem é suportado
function isMessageTypeSupported(message: string, audioUrl?: string): boolean {
  const hasValidText = Boolean(message && message.trim() && message.trim() !== "Tipo de mensagem não suportado");
  const hasAudio = Boolean(audioUrl && audioUrl.trim());
  return hasValidText || hasAudio;
}

export const  ConversationService = {

  // Método separado para processar upload de áudio
  async processAudioUpload(params: {
    audioUrl: string,
    conversationId: string
  }) {
    const { audioUrl, conversationId } = params;

    try {
      console.log("🎵 Baixando áudio da URL externa:", audioUrl);

      // Faz download do áudio da ZAPI
      const response = await axios.get(audioUrl, {
        responseType: "arraybuffer",
      });
      const audioBuffer = Buffer.from(response.data);

      console.log("🎵 Áudio baixado. Tamanho:", audioBuffer.length, "bytes");

      // Gera um nome único para o arquivo
      const audioId = uuidv4();

      // Faz upload para o GCS
      const gcsUrl = await uploadAudio(conversationId, audioId, audioBuffer);

      console.log("🎵 Áudio salvo no bucket GCS:", gcsUrl);

      return {
        success: true,
        audioUrl: gcsUrl,
        audioId: audioId
      };

    } catch (error) {
      console.error('❌ Erro ao processar upload de áudio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  async saveMessage(params: { 
    accountId: string, 
    phone: string, 
    message: string,
    sender: string,
    patientName?: string,
    status?: string,
    externalId?: string,
    externalAudioUrl?: string,
    messageType?: string
  }) {
    const {
      accountId, 
      phone, 
      message, 
      sender, 
      patientName = "",
      status = "created",
      externalId,
      externalAudioUrl
    } = params;

    try {
        const normalizedPhone = phone;
        const messageTimestamp = new Date();

        // 1. Busca conversa primeiro
        const conversation = await crud.findFirst('conversations', {
          AccountId: accountId,
          PatientPhone: normalizedPhone
        }) as { Id: string } | null;

        let conversationId: string;
        let conversationWindow: { Id: string; StartedAt: Date; ConversationId: string } | null = null;

        // 2. Cria conversa se não existir
        if (!conversation) {
            const newConversation = await crud.create('conversations', {
                AccountId: accountId,
                PatientPhone: normalizedPhone,
                Channel: "whatsapp",
                PatientName: patientName,
                Status: "open",
                StartedAt: messageTimestamp,
                LastMessageAt: messageTimestamp
            }) as { Id: string };

            conversationId = newConversation.Id;
        } else {
            conversationId = conversation.Id;
        }

        // 3. Busca janela ativa para a conversa específica
        conversationWindow = await crud.findFirst('conversationWindows', {
          ConversationId: conversationId,
          EndedAt: null
        }) as { Id: string; StartedAt: Date; ConversationId: string } | null;

        if (!conversationId) {
            throw new Error('Erro ao criar conversa');
        }

        // 4. Cria janela se não existir
        if (!conversationWindow) {
          conversationWindow = await crud.create('conversationWindows', {
            ConversationId: conversationId,
            StartedAt: messageTimestamp,
            EndedAt: null
          }) as { Id: string; StartedAt: Date; EndedAt: Date | null; ConversationId: string };
          console.log('🪟 Nova janela de conversa criada:', conversationWindow.Id);
        }

        // 5. Prepara dados da mensagem
        const messageData: any = {
            ConversationId: conversationId,
            Content: message || "-",
            Sender: sender,
            Type: "text",
            Status: status,
            Timestamp: messageTimestamp,
            PatientName: patientName,
            ConversationWindowId: conversationWindow?.Id
        };

        // 6. Processa áudio em paralelo com a criação da mensagem (se necessário)
        let audioPath: string | undefined;
        if (externalAudioUrl) {
          // Processa áudio em background para não bloquear
          this.processAudioUpload({
            audioUrl: externalAudioUrl,
            conversationId
          }).then(audioResult => {
            if (audioResult.success) {
              // Atualiza a mensagem com o caminho do áudio
              crud.update('message', messageData.Id, {
                AudioPath: audioResult.audioUrl
              }).catch(error => {
                console.error('❌ Erro ao atualizar mensagem com áudio:', error);
              });
            }
          }).catch(error => {
            console.error('❌ Erro ao processar áudio:', error);
          });
        }

        // 7. Adiciona campos opcionais
        if (externalId) {
            messageData.ExternalId = externalId;
        }

        // 8. Cria a mensagem
        const newMessage = await crud.create('message', messageData) as { Id: string };

        // 9. Verifica se precisa criar nova janela (só para mensagens do usuário)
        if (sender === "user" && conversationWindow) {
          const twentyFourHoursAgo = new Date(messageTimestamp.getTime() - 24 * 60 * 60 * 1000);
          
          // Busca a última mensagem na janela (excluindo a atual)
          const lastMessageInWindow = await crud.findFirst('message', {
            ConversationId: conversationId,
            ConversationWindowId: conversationWindow.Id,
            Id: {
              not: newMessage.Id
            }
          }, undefined, {
            Timestamp: 'desc'
          }) as { Timestamp: Date } | null;

          // Se não há mensagem anterior ou se passaram 24h desde a última
          if (!lastMessageInWindow || lastMessageInWindow.Timestamp < twentyFourHoursAgo) {
            // Fecha a janela atual e cria nova em uma única transação
            const [closedWindow, newWindow] = await Promise.all([
              crud.update('conversationWindows', conversationWindow.Id, {
                EndedAt: messageTimestamp
              }),
              crud.create('conversationWindows', {
                ConversationId: conversationId,
                StartedAt: messageTimestamp,
                EndedAt: null
              }) as Promise<{ Id: string; StartedAt: Date; EndedAt: Date | null; ConversationId: string }>
            ]);

            console.log('🪟 Janela de conversa fechada:', conversationWindow.Id);
            console.log('🪟 Nova janela de conversa criada após fechamento:', newWindow.Id);
            
            // Atualiza a mensagem para usar a nova janela
            await crud.update('message', newMessage.Id, {
              ConversationWindowId: newWindow.Id
            });

            conversationWindow = newWindow;
          }
        }

        // 10. Atualiza LastMessageAt da conversa em background
        crud.update('conversations', conversationId, {
          LastMessageAt: messageTimestamp
        }).catch(error => {
          console.error('❌ Erro ao atualizar LastMessageAt:', error);
        });

        return {
          conversationId: conversationId,
          messageId: newMessage.Id,
          conversationWindowId: conversationWindow?.Id
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
    senderName: string,
    providerMessageId: string,
    audioUrl?: string
  }) {

    const {patientPhone, message, sender, clientPhone, senderName, providerMessageId, audioUrl } = params;

    try {
        // Busca o cliente
        const normalizedClientPhone = clientPhone;
        const client = await crud.findFirst('account', {
            PhoneNumber: normalizedClientPhone
        }) as { Id: string };

        if (!client) {
            throw new Error('Cliente não encontrado');
        }

        // Valida se a mensagem existe
        let messageContent = message;
        if(!messageContent && !audioUrl){
          messageContent = "Tipo de mensagem não suportado";
        } 

        // Salva a mensagem no banco
        const saveMessageResult = await this.saveMessage({
            accountId: client.Id,
            phone: patientPhone,
            message: messageContent,
            sender,
            patientName: senderName,
            status: "sent",
            externalId: providerMessageId,
            externalAudioUrl: audioUrl,
        });


        // Se o remetente for o usuário, não processa a mensagem com o agente
        if(sender === "user" || !isMessageTypeSupported(messageContent, audioUrl)){
          return {
            success: true,
            agentResponse: null,
            saveResult: saveMessageResult
          }
        }
        
        // Busca histórico formatado usando método otimizado
        const history = await this.getFormattedHistoryWithLimit(saveMessageResult?.conversationWindowId, 10);

        console.log('🔥 history >>:', history)
        console.log('🔥 history JSON >>:', JSON.stringify(history, null, 2))
        
        // Processa a mensagem com o agente (toda lógica fica na lib)
        const agentRunResult = await processMessage(messageContent, history);

        console.log('🔥 agentRunResult >>:', agentRunResult)
        const agentResponse = agentRunResult;

        console.log('🔥 agentResponse >>:', agentResponse)

        // Envia a resposta se houver
        if (saveMessageResult && agentResponse) {
            this.handleSendMessage({
                accountId: client.Id,
                phone: patientPhone,
                message: agentResponse,
                sender: 'assistant',
                editMessageId: undefined,
            });
        }

        return {
            success: true,
            agentResponse: agentResponse,
            saveResult: saveMessageResult
        };

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

        // Busca todas as conversas do accountId
        const conversations = await crud.findMany('conversations', {
            AccountId: accountId,
        }) as { Id: string }[];

        if (!conversations || conversations.length === 0) {
            throw new Error('Nenhuma conversa encontrada para este accountId');
        }

        // Busca mensagens de todas as conversas
        const allMessages = [];
        for (const conversation of conversations) {
            const messages = await crud.findMany('message', {
                ConversationId: conversation.Id,
            }, undefined, {
                Timestamp: 'asc'
            });
            allMessages.push(...messages);
        }

        // Ordena todas as mensagens por timestamp
        allMessages.sort((a: any, b: any) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());

        // Nova lógica: se status for 'deleted' ou 'deletada', não retorna o conteúdo
        const filteredMessages = allMessages.map((msg: any) => {
          if (msg.Status === 'deleted' || msg.Status === 'deletada') {
            return {
              ...msg,
              Content: '' // ou '' se preferir string vazia
            };
          }
          return msg;
        });

        // Enriquece mensagens com URLs assinadas para áudios
        const enrichedMessages = await Promise.all(
          filteredMessages.map(async (m) => {
            if (m.AudioPath && m.AudioPath.startsWith('audios/')) {
              try {
                const signedUrl = await generateSignedUrl(m.AudioPath);
                return {
                  ...m,
                AudioUrl: signedUrl, // URL assinada para o frontend
                };
              } catch (error) {
                console.error(`❌ Erro ao gerar URL assinada para ${m.AudioPath}:`, error);
                return m; // Retorna a mensagem sem a URL assinada em caso de erro
              }
            }
            return m;
          })
        );

        return enrichedMessages;

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
    messageId: string,
    providerMessageId?: string
  }) {
    const {accountId, phone, message, sender, messageId, providerMessageId} = params;
    const conversationToken = "1690b0aa201068570c8661224cbf8d7f3783523ef4e634fb357c64989b867821";

    try {
        const response = await httpService.sendMessage(
          { message, phone, messageId, accountId, providerMessageId },
          conversationToken
        );

        if (!response.ok) {
            throw new Error('Erro ao enviar mensagem para warpMessage');
        }

        return response.data;
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

    console.log('🔥 updateMessageByExternalId externalId >>:', externalId)

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

  async updateMessagesByExternalIds(params: {
    externalIds: string[],
    updateData: { Status?: string; [key: string]: any }
  }){
    const { externalIds, updateData } = params;

    try {
        // Usa updateWhere para atualizar todas as mensagens que tenham ExternalId no array fornecido
        const result = await crud.updateWhere('message', {
            ExternalId: {
                in: externalIds
            }
        }, updateData);
        
        return result;
    } catch (error) {
        console.error('❌ Erro ao atualizar mensagens por IDs externos:', error)
        throw error;
    }
  },

  async handleSendMessage(params: {
    accountId: string,
    phone: string,
    message: string,
    sender: string,
    editMessageId?: string
  }) {
    const { accountId, phone, message, sender, editMessageId } = params;

    try {
      // Salva a mensagem no banco de dados
      let providerMessageId: string | undefined;
      let savedMessageId: string | undefined;
      let conversationId: string | undefined;

      if(editMessageId){
        const editMessage = await crud.update('message', editMessageId, {
          IsEdited: true,
          Content: message
        }) as { ExternalId: string, ConversationId: string, Id: string } | null;

        if(editMessage){
          providerMessageId = editMessage.ExternalId;
        } else {
          throw new Error('Mensagem não encontrada para edição');
        }

        savedMessageId = editMessage?.Id;
        conversationId = editMessage?.ConversationId;
        
      } else {
        const saveMessageResponse = await this.saveMessage({ 
          accountId, 
          phone, 
          message, 
          sender 
        });

        savedMessageId = saveMessageResponse.messageId;
        conversationId = saveMessageResponse.conversationId;
      }

      console.log('🔥 providerMessageId:', providerMessageId);
      
      console.log('✅ Mensagem salva no banco com sucesso', savedMessageId);

      if (!savedMessageId) {
        throw new Error('Erro ao obter ID da mensagem salva');
      }

      try {
        const warpSendMessageResponse = await this.sendMessage({
          accountId,
          phone,
          message,
          sender,
          messageId: savedMessageId,
          providerMessageId
        });

        const data = warpSendMessageResponse;

        await this.updateMessage(savedMessageId, { 
          ExternalId: data.id, 
          Status: "sent" 
        });

        console.log('🔥 warpSendMessageResponse:', warpSendMessageResponse);

        return {
            messageId: savedMessageId,
            externalId: data.id,
            conversationId: conversationId
          };

      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
        if (savedMessageId) {
          await this.updateMessage(savedMessageId, { Status: "failed" });
        }
        throw error;
      }
      

    } catch (error) {
      console.error('❌ Erro ao processar envio de mensagem:', error);
      throw error;
    }
  },

  async deleteMessage(params: {
    messageId: string,
    accountId: string,
    phone: string,
    owner: string
  }) {
    const { messageId, accountId, phone, owner } = params;

    const externalMessageId = await crud.findFirst('message', {
        Id: messageId
    }) as { ExternalId: string };

    try {
        const conversationToken = "1690b0aa201068570c8661224cbf8d7f3783523ef4e634fb357c64989b867821";
        const payload = {
            messageId: externalMessageId.ExternalId,
            accountId: accountId,
            phone: phone,
            owner: owner
        }
        
        const response = await httpService.deleteMessage(payload, conversationToken);

        if (!response.ok) {
            throw new Error('Erro ao deletar mensagem para warpMessage');
        }

        await this.updateMessage(messageId, { Status: "deleted" });

        return response.data;
    } catch (error) {
              console.error('❌ Erro ao deletar mensagem:', error)
      throw error;
    }
  },

  // Método otimizado para buscar histórico formatado
  async getFormattedHistory(conversationWindowId: string) {
    try {
      // Busca apenas os campos necessários com ordenação
      const messages = await crud.findMany('message', {
        ConversationWindowId: conversationWindowId
      }, {
        Content: true,
        Sender: true,
        Timestamp: true
      }, {
        Timestamp: 'asc'
      }) as { Content: string, Sender: string, Timestamp: Date }[];

      // Transforma para o formato esperado
      return messages.map(msg => ({
        role: msg.Sender === 'user' ? 'user' : 'agent',
        content: msg.Content
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar histórico formatado:', error);
      return [];
    }
  },

  // Método para buscar histórico com limite (para conversas muito longas)
  async getFormattedHistoryWithLimit(conversationWindowId: string, limit: number = 50) {
    try {
      // Busca as últimas mensagens usando take do Prisma (mais eficiente)
      const messages = await crud.findMany('message', {
        ConversationWindowId: conversationWindowId
      }, {
        Content: true,
        Sender: true,
        Timestamp: true
      }, {
        Timestamp: 'desc'
      }, limit) as { Content: string, Sender: string, Timestamp: Date }[];

      // Inverte para ordem cronológica e transforma
      return messages.reverse().map(msg => {
        console.log('🔥 msg >>:', msg)
        const isUserMessage = msg.Sender === 'patient';
        
        return {
          role: isUserMessage ? 'user' : 'assistant',
          content: msg.Content // Sempre retorna como texto simples
        };
      });
    } catch (error) {
      console.error('❌ Erro ao buscar histórico com limite:', error);
      return [];
    }
  }
}