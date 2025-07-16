import { crud } from '../utils/crud';
import { createOrUpdateSchedulerJob } from '../utils/googleGcpUtils';

export interface SchedulerJobConfig {
    accountId: string;
    activityType: string;
    active: boolean;
    dispatchHour?: number;
    dispatchMinute?: number;
}

export const SchedulerService = {
    
    /**
     * Gerencia jobs do scheduler baseado na configuração de atividades
     */
    async manageActivityJob(config: SchedulerJobConfig): Promise<void> {
        const { accountId, activityType, active, dispatchHour, dispatchMinute } = config;
        const jobId = `config-${accountId}-${activityType}`;
        console.log('🔥 config config config >>:', jobId)
        
        try {
            // Verifica se já existe uma configuração para esta conta e tipo de atividade
            const existingConfig = await crud.findFirst('config', {
                AccountId: accountId,
                ActivityType: activityType
            }) as { Id: string, DispatchHour?: number, DispatchMinute?: number } | null;

            console.log('🔥 existingConfig >>:', existingConfig)

            const shouldCreateOrUpdateJob = active && dispatchHour !== undefined;

            console.log('🔥 shouldCreateOrUpdateJob >>:', shouldCreateOrUpdateJob)

            if (shouldCreateOrUpdateJob) {
                // Criar cron com hora e minuto
                const minute = dispatchMinute || 0;
                const schedule = `${minute} ${dispatchHour} * * *`;
                
                // Verifica se o horário ou minuto mudou (apenas se já existia uma config)
                const hourChanged = existingConfig && existingConfig.DispatchHour !== dispatchHour;
                const minuteChanged = existingConfig && existingConfig.DispatchMinute !== dispatchMinute;
                const timeChanged = hourChanged || minuteChanged;
                
                console.log('🔥 existingConfig >>:', existingConfig)
                console.log('🔥 hourChanged >>:', hourChanged)
                console.log('🔥 minuteChanged >>:', minuteChanged)
                console.log('🔥 timeChanged >>:', timeChanged)

                if (!existingConfig || timeChanged) {
                    // await this.createOrUpdateJob(jobId, schedule, accountId, activityType);
                    console.log(`✅ Job ${jobId} ${existingConfig ? 'atualizado' : 'criado'} com sucesso`);
                } else {
                    console.log(`ℹ️ Job ${jobId} já existe e horário não mudou, mantendo configuração atual`);
                }
            } else if (existingConfig && !active) {
                console.log(`ℹ️ Atividade desativada para ${jobId}, job mantido para possível reativação`);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao gerenciar job ${jobId}:`, error);
            // Não falha a operação principal se o job falhar
        }
    },

    /**
     * Gerencia múltiplos jobs de uma conta
     */
    async manageAccountJobs(accountId: string): Promise<void> {
        const configs = await crud.findMany('config', { AccountId: accountId }) as Array<{
            ActivityType: string;
            Active: number;
            DispatchHour?: number;
        }>;

        for (const config of configs) {
            await this.manageActivityJob({
                accountId,
                activityType: config.ActivityType,
                active: config.Active === 1,
                dispatchHour: config.DispatchHour
            });
        }
    },

    /**
     * Cria ou atualiza um job específico
     */
    async createOrUpdateJob(jobId: string, schedule: string, accountId: string, activityType: string): Promise<void> {
        try{
            await createOrUpdateSchedulerJob({
                jobId,
                schedule,
                httpTargetUrl: `https://26cd3ed061b1.ngrok-free.app/api/jobs/birthdays_queue`,
                httpTargetBody: {
                    accountId,
                    ActivityType: activityType,
                    subscriberId: 'caclinicorp',//pegar do cliente logado (sistema rodando dentro do cliente)
                    solution: 'clinicorp'
                }
            });
        } catch (error) {
            console.error(`❌ Erro ao criar ou atualizar job ${jobId}:`, error);
            throw error;
        }
    },

    /**
     * Remove um job específico
     */
    async removeJob(jobId: string): Promise<void> {
        // Implementar lógica de remoção se necessário
        console.log(`🗑️ Job ${jobId} marcado para remoção`);
    },

    /**
     * Lista todos os jobs de uma conta
     */
    async listAccountJobs(accountId: string): Promise<string[]> {
        const configs = await crud.findMany('config', { AccountId: accountId }) as Array<{ Active: number, ActivityType: string }>;
        return configs
            .filter(config => config.Active === 1)
            .map(config => `config-${accountId}-${config.ActivityType}`);
    }
}; 