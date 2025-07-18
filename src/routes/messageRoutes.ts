import { Router, Response, Request } from 'express';
import { clientMiddleware, AuthenticatedRequest } from '../middleware/clientMiddleware';
import { ConversationService } from '../services/conversationService';


const router = Router();

router.post('/send_message', clientMiddleware, async (request: Request, response: Response) => {
    try {
        const { message, phone, sender, editMessageId } = request.body;
        console.log('🔥 message:', message)
        const authenticatedRequest = request as AuthenticatedRequest;
        console.log('🔥 authenticatedRequest:', authenticatedRequest.accountId)

        const result = await ConversationService.handleSendMessage({
          accountId: authenticatedRequest.accountId,
          phone: phone,
          message: message,
          sender: sender,
          editMessageId: editMessageId
        });

        console.log('✅ Mensagem enviada com sucesso');

        return response.json(result);
    
      } catch (error) {
        console.error('Erro ao processar a mensagem:', error);
        
        // Tratar erros específicos
        if (error instanceof Error) {
          if (error.message.includes('Integração não encontrada')) {
            return response.status(404).json({ message: error.message });
          }
          if (error.message.includes('Configuração da integração não encontrada')) {
            return response.status(404).json({ message: error.message });
          }
        }
        
        return response.status(500).json(
          { message: 'Erro ao processar a mensagem', error: error instanceof Error ? error.message : 'Erro desconhecido' }
        );
      }
    
});

router.get('/list_messages', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    console.log('🔥 accountId:', accountId)

    if (!accountId) {
      return res.status(400).json({ 
        message: 'accountId é obrigatório' 
      });
    }

    const messages = await ConversationService.listMessages({ accountId: accountId as string });

    return res.json(messages);
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    return res.status(500).json({ 
      error: 'Erro ao listar mensagens' 
    });
  }
});

router.delete('/delete_message', async (req: Request, res: Response) => {
  try {
    const { messageId, accountId, phone, owner } = req.body;
    await ConversationService.deleteMessage({ messageId, accountId, phone, owner });
    return res.json({ success: true, message: 'Mensagem deletada' });
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    return res.status(500).json({ 
      error: 'Erro ao deletar mensagem' 
    });
  }
});

router.post('/test', async (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Rota de teste' });
});

export default router;
