import cloudTasks from "@google-cloud/tasks";
import config from "../config/enviroments";
import { CONST } from "./CONSTANTS";
import { v4 as uuidv4 } from 'uuid';

const client = new cloudTasks.CloudTasksClient();
const projectId = config.get("GCLOUD_PROJECT");
const location = config.get("GCLOUD_LOCATION") || "us-central1";

export const addTask = async (queue: string, handler: string, payload: any, addInfo?: any) => {

    const objTask = {
        uuid: uuidv4(),
        CreateTime: new Date(),
        Status: CONST.Task.Status.CREATED,
        Queue: queue,
        UrlHandler: handler,
        Reference: (addInfo ? addInfo.Reference : undefined),
        Payload: payload ? JSON.stringify(payload) : undefined,
    };
      
    try {
        // Construir o caminho da fila
        const queuePath = client.queuePath(projectId, location, queue);
        
        // Criar a task request
        const task = {
            httpRequest: {
                httpMethod: 'POST' as const,
                url: handler,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: payload ? Buffer.from(JSON.stringify(payload)).toString('base64') : undefined,
            },
        };

        // Criar a task na fila
        const [response] = await client.createTask({
            parent: queuePath,
            task: task,
        });

        // Atualizar o status da task
        objTask.Status = CONST.Task.Status.SCHEDULED;
        
        return {
            success: true,
            task: objTask,
            cloudTaskName: response.name,
        };

    } catch (error) {
        console.error('Erro ao criar task no Google Cloud Tasks:', error);
        objTask.Status = CONST.Task.Status.ERROR;
        
        return {
            success: false,
            task: objTask,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

// Função simplificada para criar tasks de aniversário
export const createBirthdayTask = async (url: string, payload: any) => {
    const queueName = config.get("BIRTHDAYS_QUEUE");
    const isDevelopment = process.env.NODE_ENV === "development";

    console.log('🔥 isDevelopment >>:', isDevelopment);

    if(isDevelopment) {
        //post para a própria solução
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response;
    } else {
        return await addTask(queueName, url, payload);
    }
}

// Função para criar task com delay
export const addTaskWithDelay = async (queue: string, handler: string, payload: any, delaySeconds: number, addInfo?: any) => {
    const objTask = {
        uuid: uuidv4(),
        CreateTime: new Date(),
        Status: CONST.Task.Status.CREATED,
        Queue: queue,
        UrlHandler: handler,
        Reference: (addInfo ? addInfo.Reference : undefined),
        Payload: payload ? JSON.stringify(payload) : undefined,
    };
      
    try {
        const queuePath = client.queuePath(projectId, location, queue);
        
        // Calcular o tempo de execução
        const scheduledTime = new Date();
        scheduledTime.setSeconds(scheduledTime.getSeconds() + delaySeconds);
        
        const task = {
            httpRequest: {
                httpMethod: 'POST' as const,
                url: handler,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: payload ? Buffer.from(JSON.stringify(payload)).toString('base64') : undefined,
            },
            scheduleTime: {
                seconds: Math.floor(scheduledTime.getTime() / 1000),
            },
        };

        const [response] = await client.createTask({
            parent: queuePath,
            task: task,
        });

        objTask.Status = CONST.Task.Status.SCHEDULED;
        
        return {
            success: true,
            task: objTask,
            cloudTaskName: response.name,
            scheduledTime: scheduledTime,
        };

    } catch (error) {
        console.error('Erro ao criar task com delay no Google Cloud Tasks:', error);
        objTask.Status = CONST.Task.Status.ERROR;
        
        return {
            success: false,
            task: objTask,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}