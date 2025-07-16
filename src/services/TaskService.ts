import { createBirthdayTask, addTask, addTaskWithDelay } from '../lib/tasks';
import { crud } from '../utils/crud';
import { solutionCore } from './solutions/solutionsCore';

export interface TaskData {
    [key: string]: any;
}

export interface TaskResult {
    name: string;
    taskId?: string;
    status: 'created' | 'sent' | 'error';
    error?: string;
    errorType?: 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'QUEUE_NOT_FOUND' | 'UNKNOWN_ERROR';
}

export interface TaskSummary {
    totalTasks: number;
    tasksCreatedCount: number;
    tasksErrorsCount: number;
    tasksCreated: TaskResult[];
    tasksErrors: TaskResult[];
}

export interface BirthdayData {
    PatientId: string;
    Name: string;
    BirthDate: string;
    Email?: string;
    MobilePhone?: string;
    Age?: string;
}

export interface Account {
    Id: string;
    ExternalSubscriberId: string;
    [key: string]: any;
}

export class TaskService {
    /**
     * Cria tasks de aniversário para uma lista de aniversariantes
     */
    public static async createBirthdayTasks(solution: string): Promise<TaskSummary> {

        const accounts = await crud.findAll<Account>('account');
        console.log('🔥 accounts >>:', accounts);
        
        const allTasksCreated: TaskResult[] = [];
        const allTasksErrors: TaskResult[] = [];
        let totalBirthdays = 0;

        for (const account of accounts) {
            try {
                const birthdays = await solutionCore(solution).getBirthdays(account.ExternalSubscriberId);
                console.log('🔥 birthdays para account', account.Id, '>>:', birthdays);

                totalBirthdays += birthdays.length;

                for (const birthday of birthdays) {
                    const result = await this.createBirthdayTask(birthday, account.Id);
                    
                    if (result.status === 'created') {
                        allTasksCreated.push(result);
                    } else {
                        allTasksErrors.push(result);
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao processar account', account.Id, ':', error);
                // Adiciona um erro para esta conta
                allTasksErrors.push({
                    name: `Account ${account.Id}`,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    errorType: 'UNKNOWN_ERROR'
                });
            }
        }

        const summary: TaskSummary = {
            totalTasks: totalBirthdays,
            tasksCreatedCount: allTasksCreated.length,
            tasksErrorsCount: allTasksErrors.length,
            tasksCreated: allTasksCreated,
            tasksErrors: allTasksErrors
        };

        console.log('📊 Resumo da criação de tasks:', {
            total: summary.totalTasks,
            criadas: summary.tasksCreatedCount,
            erros: summary.tasksErrorsCount
        });

        return summary;
    }

    /**
     * Cria uma task genérica
     */
    public static async createTask(queue: string, handler: string, payload: any, addInfo?: any): Promise<TaskResult> {
        try {
            console.log('🔥 Criando task genérica para:', handler);
            
            const taskResult = await addTask(queue, handler, payload, addInfo);

            if (taskResult.success) {
                console.log('✅ Task criada com sucesso:', taskResult.cloudTaskName);
                return {
                    name: addInfo?.name || 'Task genérica',
                    taskId: taskResult.cloudTaskName || undefined,
                    status: 'created'
                };
            } else {
                const errorType = this.categorizeError(taskResult.error);
                console.error('❌ Erro ao criar task:', taskResult.error);
                return {
                    name: addInfo?.name || 'Task genérica',
                    status: 'error',
                    error: taskResult.error,
                    errorType
                };
            }

        } catch (error) {
            const errorType = this.categorizeError(error instanceof Error ? error.message : 'Erro desconhecido');
            console.error('❌ Erro ao processar task:', error);
            return {
                name: addInfo?.name || 'Task genérica',
                status: 'error',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                errorType
            };
        }
    }

    /**
     * Cria uma task com delay
     */
    public static async createTaskWithDelay(
        queue: string, 
        handler: string, 
        payload: any, 
        delaySeconds: number, 
        addInfo?: any
    ): Promise<TaskResult> {
        try {
            console.log('🔥 Criando task com delay para:', handler, 'delay:', delaySeconds, 's');
            
            const taskResult = await addTaskWithDelay(queue, handler, payload, delaySeconds, addInfo);

            if (taskResult.success) {
                console.log('✅ Task com delay criada com sucesso:', taskResult.cloudTaskName);
                return {
                    name: addInfo?.name || 'Task com delay',
                    taskId: taskResult.cloudTaskName || undefined,
                    status: 'created'
                };
            } else {
                const errorType = this.categorizeError(taskResult.error);
                console.error('❌ Erro ao criar task com delay:', taskResult.error);
                return {
                    name: addInfo?.name || 'Task com delay',
                    status: 'error',
                    error: taskResult.error,
                    errorType
                };
            }

        } catch (error) {
            const errorType = this.categorizeError(error instanceof Error ? error.message : 'Erro desconhecido');
            console.error('❌ Erro ao processar task com delay:', error);
            return {
                name: addInfo?.name || 'Task com delay',
                status: 'error',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                errorType
            };
        }
    }

    /**
     * Cria múltiplas tasks genéricas
     */
    public static async createMultipleTasks(
        tasks: Array<{
            queue: string;
            handler: string;
            payload: any;
            addInfo?: any;
        }>
    ): Promise<TaskSummary> {
        console.log('🔥 Iniciando criação de', tasks.length, 'tasks');

        const tasksCreated: TaskResult[] = [];
        const tasksErrors: TaskResult[] = [];

        for (const task of tasks) {
            const result = await this.createTask(task.queue, task.handler, task.payload, task.addInfo);
            
            if (result.status === 'created') {
                tasksCreated.push(result);
            } else {
                tasksErrors.push(result);
            }
        }

        const summary: TaskSummary = {
            totalTasks: tasks.length,
            tasksCreatedCount: tasksCreated.length,
            tasksErrorsCount: tasksErrors.length,
            tasksCreated,
            tasksErrors
        };

        console.log('📊 Resumo da criação de tasks:', {
            total: summary.totalTasks,
            criadas: summary.tasksCreatedCount,
            erros: summary.tasksErrorsCount
        });

        return summary;
    }

    /**
     * Categoriza o tipo de erro baseado na mensagem
     */
    private static categorizeError(errorMessage: string | undefined): 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR' {
        const message = (errorMessage || '').toLowerCase();
        
        if (message.includes('permission_denied') || message.includes('api has not been used') || message.includes('disabled')) {
            return 'PERMISSION_DENIED';
        }
        
        if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
            return 'NETWORK_ERROR';
        }
        
        if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
            return 'VALIDATION_ERROR';
        }
        
        return 'UNKNOWN_ERROR';
    }

    // Métodos privados para tasks específicas
    private static formatPhoneNumber(phone: string | undefined): string {
        const defaultPhone = '554784041066';
        const phoneToUse = phone || defaultPhone;
        console.log('🔥 phone >>:', phoneToUse);
        
        const cleanPhone = phoneToUse.replace(/\D/g, '');
        
        // Se já tem 13 dígitos (55 + DDD + número), retorna como está
        if (cleanPhone.length === 13) return cleanPhone;
        
        // Se tem 11 dígitos (DDD + número), adiciona 55
        if (cleanPhone.length === 11) return '55' + cleanPhone;
        
        // Se tem 10 dígitos (número sem DDD), adiciona 5547 (55 + DDD padrão)
        if (cleanPhone.length === 10) return '5547' + cleanPhone;
        
        // Caso padrão
        return defaultPhone;
    }

    private static prepareBirthdayTaskPayload(birthday: BirthdayData, accountId: string) {
        return {
            Name: birthday.Name,
            accountId: accountId,
            BirthDate: birthday.BirthDate,
            Age: birthday.Age || '0',
            MobilePhone: this.formatPhoneNumber(birthday.MobilePhone)
        };
    }

    private static async createBirthdayTask(birthday: BirthdayData, accountId: string): Promise<TaskResult> {
        try {

            const taskPayload = this.prepareBirthdayTaskPayload(birthday, accountId);
            console.log('🔥 taskPayload >>:', taskPayload);
            
            const taskResult = await createBirthdayTask(
                'https://5530146c85ea.ngrok-free.app/api/jobs/execute_birthdays_task',
                taskPayload
            );

            // Verifica se é um Response (desenvolvimento) ou objeto (produção)
            if (taskResult instanceof Response) {
                // Em desenvolvimento - verifica o status do fetch
                if (taskResult.ok) {
                    console.log('✅ Task criada para:', birthday.Name, 'Status:', taskResult.status);
                    return {
                        name: birthday.Name,
                        status: 'sent'
                    };
                } else {
                    const errorType = this.categorizeError(`HTTP ${taskResult.status}: ${taskResult.statusText}`);
                    console.error('❌ Erro ao criar task para:', birthday.Name, 'Status:', taskResult.status);
                    return {
                        name: birthday.Name,
                        status: 'error',
                        error: `HTTP ${taskResult.status}: ${taskResult.statusText}`,
                        errorType
                    };
                }
            } else {
                // Em produção - verifica o objeto de retorno
                if (taskResult.success) {
                    const cloudTaskName = 'cloudTaskName' in taskResult ? taskResult.cloudTaskName : undefined;
                    console.log('✅ Task criada para:', birthday.Name, cloudTaskName);
                    return {
                        name: birthday.Name,
                        taskId: cloudTaskName || undefined,
                        status: 'created'
                    };
                } else {
                    const error = 'error' in taskResult ? taskResult.error : 'Erro desconhecido';
                    const errorType = this.categorizeError(error);
                    console.error('❌ Erro ao criar task para:', birthday.Name, error);
                    return {
                        name: birthday.Name,
                        status: 'error',
                        error: error,
                        errorType
                    };
                }
            }

        } catch (error) {
            const errorType = this.categorizeError(error instanceof Error ? error.message : 'Erro desconhecido');
            console.error('❌ Erro ao processar aniversariante:', birthday.Name, error);
            return {
                name: birthday.Name,
                status: 'error',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                errorType
            };
        }
    }
} 