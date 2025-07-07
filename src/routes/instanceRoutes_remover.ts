import { Router } from 'express';
import { ConfigService } from '../services/config/configService';

const router = Router();

router.get('/qrcode/image', async (req, res) => {
    const { accountId } = req.query;

    try {
        const qrcode = await ConfigService.getQrcodeImage(accountId as string);

        res.json(qrcode);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

router.get('/phone-code', async (req, res) => {
    const { accountId, phone } = req.query;

    try {
        const phoneCode = await ConfigService.getPhoneCode(accountId as string, phone as string);
        res.json(phoneCode);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

export default router;