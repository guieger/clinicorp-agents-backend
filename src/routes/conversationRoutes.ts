import { Router } from 'express';
import { ConversationService } from '../services/conversationService';

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


export default router;