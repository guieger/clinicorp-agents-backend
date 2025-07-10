import { Router, Request, Response } from 'express';
import { handleError } from '../utils/errorHandler';
import { solutionCore } from '../services/solutions/solutionsCore';
import { runAgent } from '../lib/agentsSDK';
import { ConfigService } from '../services/configService';

const router = Router();

router.post('/birthdays_queue', async (req: Request, res: Response) => {
    try {
        const { date, subscriberId, solution = 'clinicorp' } = req.body;

        if (!date || !subscriberId) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetros obrigatórios: date e subscriberId'
            });
        }

        const birthdays = await solutionCore(solution).getBirthdays(date, subscriberId);

        //criar fila do ETM

        return res.json({ 
            success: true, 
            message: 'Aniversariantes listados', 
            birthdays 
        });
    } catch (error) {
        handleError(error, res, 'Erro ao buscar aniversariantes', req);
    }
});

router.post('/execute_birthdays_task', async (req: Request, res: Response) => {
    try {

        const mockedResult =   {
            Name: 'Guilherme Eger',
            BirthDate: '1998-11-27T02:00:00.000Z',
            Age: 26,
            MobilePhone: '554784041066'
        }

        const toneOfVoice: string = "Formal";
        const formattedPhone = mockedResult.MobilePhone.replace('(', '').replace(')', '').replace('-', '');
        const accountId: string = 'a1a473db-55cc-11f0-aa9d-7ac2abadd37a';
        const usingTemplate: boolean = true;
        let message: string | undefined;

        //vai executar a tarefa de aniversariantes
        if (usingTemplate) {
            message = await ConfigService.getTemplateMessage(accountId);
        } else {
            message = await runAgent(`
                Escreva uma mensagem de aniversário para esse paciente: ${JSON.stringify(mockedResult)}
                Com o tom de voz: ${toneOfVoice}
                Essa mensagem vai ser enviada para o paciente pelo WhatsApp diretamente, então já monte nesse modelo sem me responder com nada, apenas a mensagem.
            `);
        }

        //Aqui
        
        // Enviar a mensagem gerada pelo agente
        if (message) {
            try {
                const { ConversationService } = await import('../services/conversationService');
                
                const messageResult = await ConversationService.handleSendMessage({
                    accountId: accountId,
                    phone: formattedPhone,
                    message: message,
                    sender: 'agent',
                    editMessageId: undefined
                });

                console.log('✅ Mensagem de aniversário enviada com sucesso:', messageResult);
                
                return res.json({ 
                    success: true, 
                    message: 'Mensagem de aniversário gerada e enviada', 
                    result: message,
                    messageSent: true,
                    messageData: messageResult
                });
            } catch (messageError) {
                console.error('❌ Erro ao enviar mensagem:', messageError);
                return res.json({ 
                    success: true, 
                    message: 'Mensagem de aniversário gerada, mas erro ao enviar', 
                    result: message,
                    messageSent: false,
                    error: messageError instanceof Error ? messageError.message : 'Erro desconhecido'
                });
            }
        }

    } catch (error) {
        handleError(error, res, 'Erro ao executar tarefa de aniversariantes', req);
    }
});

export default router;
