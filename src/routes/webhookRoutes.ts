import { Router, Response, Request } from 'express';
import { NotificationCore } from "../services/notifications/core/notificationCore";
import { ConversationService } from '../services/conversation/conversationService';
import { translateWebhookPayload } from '../utils/webhookTranslator';
import { handleError } from '../utils/errorHandler';

const router = Router();

router.post('/receive_message', async (req: Request, res: Response) => {
    try {
        
        const provider = req.body.provider;
        const _payload = req.body;

        console.log('🔥 _payload >>:', _payload)
        const payload = translateWebhookPayload(provider, _payload);
        console.log('✅ Payload traduzido >>:', payload);

        const { patientPhone, message, clientPhone, senderName } = payload;

        await ConversationService.handleExternalSaveMessage({ 
            patientPhone, 
            message, 
            senderName,
            sender: "patient", 
            clientPhone 
        });

        await new NotificationCore('momento').sendNotification({
            evt: 'receive_message',
            key: 'key', 
            obj: {},
            signal: 'receive_message'
        });

        return res.json({ success: true, message: 'Webhook recebido' });

    } catch (error) {
        console.error('Erro ao processar o webhook:', error);
        handleError(res, error, 'Erro ao processar o webhook', 500);
    }
});

router.post('/update_status', async (req: Request, res: Response) => {
    try {
        const { providerMessageId, status } = req.body;

        await ConversationService.updateMessageByExternalId({
            externalId: providerMessageId,
            updateData: {
                Status: status
            }
        });

        await new NotificationCore('momento').sendNotification({
            evt: 'update_status',
            key: 'key', 
            obj: {},
            signal: 'update_status'
        });

        return res.json({ success: true, message: 'Status atualizado' });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        handleError(res, error, 'Erro ao atualizar status', 500);
    }
});

router.post('/test', async (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Rota de webhook' });
});

export default router;
