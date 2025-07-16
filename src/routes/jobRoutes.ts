import { Router, Request, Response } from 'express';
import { handleError } from '../utils/errorHandler';
import { runAgent } from '../lib/agents/agentsSDK';
import { ConfigService } from '../services/configService';
import { TaskService } from '../services/TaskService';

const router = Router();

router.post('/birthdays_queue', async (req: Request, res: Response) => {
    try {
        const { solution = 'clinicorp' } = req.body;

        if (!solution) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetros obrigatórios: date e subscriberId'
            });
        }        

        const summary = await TaskService.createBirthdayTasks(solution);

        const hasErrors = summary.tasksErrorsCount > 0;
        const hasSuccess = summary.tasksCreatedCount > 0;
        
        let success = false;
        let message = '';

        if (hasErrors && !hasSuccess) {
            // Falha total - nenhuma task foi criada
            success = false;
            message = `Falha ao criar tasks de aniversário. ${summary.tasksErrorsCount} erro(s) encontrado(s).`;
        } else if (hasErrors && hasSuccess) {
            // Sucesso parcial - algumas tasks foram criadas, outras falharam
            success = true;
            message = `Tasks de aniversário criadas com sucesso parcial. ${summary.tasksCreatedCount} criada(s), ${summary.tasksErrorsCount} erro(s).`;
        } else {
            // Sucesso total - todas as tasks foram criadas
            success = true;
            message = `Tasks de aniversário criadas com sucesso. ${summary.tasksCreatedCount} task(s) criada(s).`;
        }

        return res.json({ 
            success,
            message,
            summary: {
                totalBirthdays: summary.totalTasks,
                tasksCreated: summary.tasksCreatedCount,
                tasksErrors: summary.tasksErrorsCount
            },
            tasksCreated: summary.tasksCreated,
            tasksErrors: summary.tasksErrors
        });
    } catch (error) {
        handleError(error, res, 'Erro ao criar tasks de aniversário', req);
    }
});

router.post('/execute_birthdays_task', async (req: Request, res: Response) => {
    try {

        const { Name, BirthDate, Age, MobilePhone, accountId } = req.body;
        //retornar estrutura de retorno do ETM 

        if(!accountId || !Name || !BirthDate || !Age || !MobilePhone) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetros obrigatórios: accountId'
            });
        }

        console.log('🔥 req.body execute_birthdays_task >>:', req.body)

        const formattedPhone = MobilePhone.replace('(', '').replace(')', '').replace('-', '');
        
        const config = await ConfigService.getActivity(accountId, 'birthday', {
            ToneOfVoice: true,
            TemplateId: true
        }) as { ToneOfVoice?: string; TemplateId?: string };

        if(!config) { 
            return res.status(400).json({
                success: false,
                message: 'Configuração não encontrada'
            });
        }

        const toneOfVoice: string = config?.ToneOfVoice || "Formal";
        const usingTemplate: boolean = config?.TemplateId ? true : false;
        const templateId: string = config?.TemplateId || '';
        let message: string | undefined;

        //vai executar a tarefa de aniversariantes
        if (usingTemplate && templateId) {
            message = await ConfigService.getTemplateMessage(Name, templateId, { Name, BirthDate, Age });
        } else {
            const agentResult = await runAgent(`
                Escreva uma mensagem de aniversário para esse paciente: ${JSON.stringify({Name, BirthDate, Age})}
                Com o tom de voz: ${toneOfVoice}
                Essa mensagem vai ser enviada para o paciente pelo WhatsApp diretamente, então já monte nesse modelo sem me responder com nada, apenas a mensagem.
            `, []);
            
            message = typeof agentResult === 'string' ? agentResult : (agentResult as any).response;
        }

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
