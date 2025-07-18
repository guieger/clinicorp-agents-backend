import { Router, Response, Request } from 'express';
import { ConversationService } from '../services/conversationService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello World');
});

router.get('/list', async (req, res) => {

    const { accountId } = req.query;

    try {
        const conversations = await ConversationService.listConversation(accountId as string);

        res.json(conversations);
    } catch (error) {
        res.status(500).json({
            message: 'Erro ao listar conversas',
            error: 'Erro desconhecido ao listar conversas'
        });
    }

});

router.get('/conversation_window', async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const { conversationId } = req.params;
    const { accountId } = authenticatedRequest; 

    try {
        const conversationWindow = await ConversationService.getConversationWindowByConversation(conversationId);
        res.json(conversationWindow);
    } catch (error) {   
        res.status(500).json({ message: 'Erro ao buscar janela de conversa' });
    }
});


export default router;