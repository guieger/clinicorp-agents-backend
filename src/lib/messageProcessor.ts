import { crud } from '../utils/crud';

interface MessageInput {
  message: string;
  externalAudioUrl?: string;
  providerMessageId: string;
}

interface AgentInput {
  text?: string;
  audioPath?: string;
  messageType?: 'text' | 'audio' | 'multimodal';
}

export class MessageProcessor {
  
  static async processMessage(messageInput: MessageInput): Promise<AgentInput> {
    const { message, externalAudioUrl, providerMessageId } = messageInput;
    
    let messageContent = message;
    let audioPath: string | undefined;
    
    // Se tem áudio, busca o audioPath no banco
    if (externalAudioUrl) {
      try {
        console.log('🎵 Buscando audioPath para transcrição...');
        
        // Aguarda um pouco para garantir que o upload foi concluído
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const savedMessage = await crud.findFirst('message', {
          ExternalId: providerMessageId
        }) as { AudioPath?: string };

        if (savedMessage?.AudioPath) {
          audioPath = savedMessage.AudioPath;
          console.log('🎵 AudioPath encontrado:', audioPath);
        } else {
          console.warn('⚠️ AudioPath não encontrado para:', providerMessageId);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar audioPath:', error);
      }
    }

    // Prepara o input para o agente
    if (audioPath && messageContent && messageContent.trim()) {
      // Mensagem multimodal (áudio + texto)
      return {
        text: messageContent,
        audioPath: audioPath,
        messageType: 'multimodal'
      };
    } else if (audioPath) {
      // Apenas áudio
      return {
        audioPath: audioPath,
        messageType: 'audio'
      };
    } else if (messageContent && messageContent.trim()) {
      // Apenas texto
      return {
        text: messageContent,
        messageType: 'text'
      };
    } else {
      throw new Error('Nenhum conteúdo válido fornecido para processamento');
    }
  }
} 