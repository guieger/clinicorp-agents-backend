import { Router, Response, Request } from 'express';
import { NotificationCore } from "../services/notifications/core/notificationCore";
import { ConversationService } from '../services/conversationService';
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

        const { patientPhone, message, clientPhone, senderName, providerMessageId, audioUrl, fromMe } = payload;

        await ConversationService.handleExternalSaveMessage({ 
            patientPhone, 
            message, 
            senderName,
            sender: fromMe ? "user" : "patient", 
            clientPhone,
            providerMessageId,
            audioUrl
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
        handleError(error, res, 'Erro ao processar o webhook', req);
    }
});

router.post('/update_status', async (req: Request, res: Response) => {
    try {
        const { providerMessageId, status } = req.body;

        console.log('🔥 providerMessageId >>:', providerMessageId)
        console.log('🔥 update_status status >>:', status)

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
        console.error('❌ Erro ao atualizar status:', error);
        handleError(error, res, 'Erro ao atualizar status', req);
    }
});

router.post('/update_status_batch', async (req: Request, res: Response) => {
    try {
        const { status, providerMessageIds } = req.body;

        console.log('🔥 update_status_batch status >>:', status)
        console.log('🔥 providerMessageIds >>:', providerMessageIds)

        // Verifica se providerMessageIds é um array
        if (!Array.isArray(providerMessageIds)) {
            return res.status(400).json({ 
                success: false, 
                message: 'providerMessageIds deve ser um array' 
            });
        }

        // Atualiza todas as mensagens em uma única operação
        await ConversationService.updateMessagesByExternalIds({
            externalIds: providerMessageIds,
            updateData: {
                Status: status
            }
        });

        await new NotificationCore('momento').sendNotification({
            evt: 'update_status_batch',
            key: 'key', 
            obj: {},
            signal: 'update_status_batch'
        });

        return res.json({ 
            success: true, 
            message: `Status atualizado para ${providerMessageIds.length} mensagens` 
        });
    } catch (error) {
        console.error(' ❌ Erro ao atualizar status em lote:', error);
        handleError(error, res, 'Erro ao atualizar status em lote', req);
    }
});

router.post('/test', async (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Rota de webhook' });
});

export default router;
