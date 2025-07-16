import { Router } from 'express';
import { ConfigService } from '../services/configService';
import { handleError } from '../utils/errorHandler';

const router = Router();

router.get('/qrcode/image', async (req, res) => {
    const { accountId } = req.query;

    try {
        const qrcode = await ConfigService.getQrcodeImage(accountId as string);

        res.json(qrcode);
    } catch (error) {
        handleError(error, res, 'Erro ao buscar QRCode', req);
    }
});

router.post('/account/create', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'name é obrigatório' });
    }

    try {
        const account = await ConfigService.createAccount(name);

        console.log('🔥 account:', account)

        res.json(account);
    } catch (error) {
        handleError(error, res, 'Erro ao criar conta', req);
    }
});

router.get('/account', async (req, res) => {
    const { accountId } = req.query;

    try {
        const account = await ConfigService.getAccount(accountId as string);

        res.json(account);
    } catch (error) {
        handleError(error, res, 'Erro ao buscar conta', req);
    }
});

router.post('/channel/create', async (req, res) => {
    const { accountId, channelName } = req.body;

    if (!accountId || !channelName) {
        return res.status(400).json({ error: 'accountId e channelName são obrigatórios' });
    }

    try {
        const channel = await ConfigService.createChannel(accountId, channelName);

        res.json(channel);
    } catch (error) {
        handleError(error, res, 'Erro ao criar canal', req);
    }
});

router.get('/whatsapp/channel', async (req, res) => {
    const { accountId } = req.query;

    try {
        const channel = await ConfigService.getWhatsappChannel(accountId as string);

        res.json(channel);
    } catch (error) {
        handleError(error, res, 'Erro ao buscar canal', req);
    }
});

router.post('/whatsapp/channel/activate', async (req, res) => {
    const { accountId, channelId } = req.body;

    if (!accountId || !channelId) {
        return res.status(400).json({ error: 'accountId e channelId são obrigatórios' });
    }

    try {

        const channel = await ConfigService.activateWhatsappChannel(accountId, channelId);

        res.json(channel);
    } catch (error) {
        handleError(error, res, 'Erro ao ativar canal', req);
    }
});

router.post('/conversation/vinculate', async (req, res) => {
    const { clientId } = req.body;  

    try {
        const conversationAccount = await ConfigService.vinculateConversation(clientId);

        res.json(conversationAccount);
    } catch (error) {
        handleError(error, res, 'Erro ao vincular conta', req);
    }

   
});

router.get('/conversation/vinculated', async (req, res) => {
    const { clientId } = req.query;

    if (!clientId) {
        return res.status(400).json({ error: 'clientId é obrigatório' });
    }

    try {
        const conversationAccount = await ConfigService.verifyVinculatedConversation(clientId as string);

        res.json(conversationAccount);
    } catch (error) {
        handleError(error, res, 'Erro ao verificar vinculação de conta', req);
    }
});

router.post('/activities', async (req, res) => {
    const { 
        accountId, 
        ActivityType, 
        Active, 
        ToneOfVoice, 
        DispatchHour, 
        DispatchMinute,
        TemplateType, 
        TemplateId,
        HasFollowUp,
        FollowUpDelayHours
    } = req.body;

    if (!accountId || !ActivityType) {
        return res.status(400).json({ error: 'accountId e ActivityType são obrigatórios' });
    }

    const validActivityTypes = ["birthday", "appointment", "follow_up", "other"];

    if (!validActivityTypes.includes(ActivityType)) {
        return res.status(400).json({ error: 'ActivityType inválido' });
    }

    try {
        const result = await ConfigService.saveConfig({
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
        });

        res.json(result);
    } catch (error) {
        handleError(error, res, 'Erro ao salvar configuração de atividades', req);
    }
});

router.get('/activities', async (req, res) => {
    const { accountId } = req.query;

    try {


        const activities = await ConfigService.getActivities(accountId as string, {
            Active: true,
            ActivityType: true,
            DispatchHour: true,
            DispatchMinute: true,
            FollowUpDelayHours: true,
            HasFollowUp: true,
            ToneOfVoice: true,
            TemplateId: true,
        });

        res.json(activities);
    } catch (error) {
        handleError(error, res, 'Erro ao buscar configurações de atividades', req);
    }
});

router.get('/message/templates', async (req, res) => {
    const { accountId } = req.query;

    try {
        const templates = await ConfigService.getTemplates(accountId as string);

        res.json(templates);
    } catch (error) {
        handleError(error, res, 'Erro ao buscar templates de mensagens', req);
    }
});

export default router;