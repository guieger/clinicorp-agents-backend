import { Storage } from "@google-cloud/storage";
import path from 'path';
import { CloudSchedulerClient, protos } from '@google-cloud/scheduler';

// Configuração do Google Cloud Storage
const storage = new Storage({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || path.join(process.cwd(), 'dev-clinicorp-agents-2ca03aa7d502.json')
});

const bucketName = "clinicorp-agents-chat";
const bucket = storage.bucket(bucketName);

// ===== STORAGE FUNCTIONS =====
export async function uploadAudio(chatId: string, audioId: string, audioBuffer: Buffer) {
  const destination = `audios/chat/${chatId}/${audioId}.webm`;
  console.log("🎵 Uploading audio to:", destination);

  const file = bucket.file(destination);
  console.log("🎵 File:", file);

  await file.save(audioBuffer, { contentType: 'audio/webm' });

  return destination;
}

export async function generateSignedUrl(path: string) {
    const file = bucket.file(path);
  
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });
  
    return url;
}

// ===== SCHEDULER FUNCTIONS =====
const scheduler = new CloudSchedulerClient({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || path.join(process.cwd(), 'dev-clinicorp-agents-2ca03aa7d502.json')
});

/**
 * Cria um job no Google Cloud Scheduler
 * @param {string} params.location - Região do scheduler (ex: 'us-central1')
 * @param {string} params.jobId - Nome único do job
 * @param {string} params.schedule - Cron (ex: '0 9 * * *')
 * @param {string} params.httpTargetUrl - URL a ser chamada
 * @param {object} [params.httpTargetBody] - Body opcional para requisição POST
 */
export async function createSchedulerJob({ jobId, schedule, httpTargetUrl, httpTargetBody }: {
  jobId: string,
  schedule: string,
  httpTargetUrl: string,
  httpTargetBody?: any
}) {
  
  const projectId = process.env.GOOGLE_CLOUD_SCHEDULER_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_SCHEDULER_LOCATION;

  const parent = scheduler.locationPath(projectId!, location!);

  const job = {
    name: `${parent}/jobs/${jobId}`,
    schedule,
    timeZone: 'America/Sao_Paulo',
    httpTarget: {
      uri: httpTargetUrl,
      httpMethod: protos.google.cloud.scheduler.v1.HttpMethod.POST,
      body: httpTargetBody ? Buffer.from(JSON.stringify(httpTargetBody)) : undefined,
      headers: { 'Content-Type': 'application/json' },
    },
  };

  try {
    const [response] = await scheduler.createJob({ parent, job });
    return response;
  } catch (error: any) {
    if (error.code === 6) { // Already exists
      return { message: 'Job já existe', jobId };
    }
    throw error;
  }
}

/**
 * Atualiza um job existente no Google Cloud Scheduler
 * @param {string} params.jobId - Nome único do job
 * @param {string} params.schedule - Cron (ex: '0 9 * * *')
 * @param {string} params.httpTargetUrl - URL a ser chamada
 * @param {object} [params.httpTargetBody] - Body opcional para requisição POST
 */
export async function updateSchedulerJob({ jobId, schedule, httpTargetUrl, httpTargetBody }: {
  jobId: string,
  schedule: string,
  httpTargetUrl: string,
  httpTargetBody?: any
}) {
  
  const projectId = process.env.GOOGLE_CLOUD_SCHEDULER_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_SCHEDULER_LOCATION;

  const jobName = scheduler.jobPath(projectId!, location!, jobId);

  const job = {
    name: jobName,
    schedule,
    timeZone: 'America/Sao_Paulo',
    httpTarget: {
      uri: httpTargetUrl,
      httpMethod: protos.google.cloud.scheduler.v1.HttpMethod.POST,
      body: httpTargetBody ? Buffer.from(JSON.stringify(httpTargetBody)) : undefined,
      headers: { 'Content-Type': 'application/json' },
    },
  };

  try {
    const [response] = await scheduler.updateJob({ job });
    console.log(`✅ Job ${jobId} atualizado com sucesso`);
    return response;
  } catch (error: any) {
    console.error(`❌ Erro ao atualizar job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Verifica se um job existe no Google Cloud Scheduler
 * @param {string} params.jobId - Nome único do job
 */
export async function checkSchedulerJobExists({ jobId }: {
  jobId: string
}) {
  
  const projectId = process.env.GOOGLE_CLOUD_SCHEDULER_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_SCHEDULER_LOCATION;

  const jobName = scheduler.jobPath(projectId!, location!, jobId);

  try {
    const [job] = await scheduler.getJob({ name: jobName });
    return { exists: true, job };
  } catch (error: any) {
    if (error.code === 5) { // NOT_FOUND
      return { exists: false, job: null };
    }
    throw error;
  }
}

/**
 * Cria ou atualiza um job no Google Cloud Scheduler
 * @param {string} params.jobId - Nome único do job
 * @param {string} params.schedule - Cron (ex: '0 9 * * *')
 * @param {string} params.httpTargetUrl - URL a ser chamada
 * @param {object} [params.httpTargetBody] - Body opcional para requisição POST
 */
export async function createOrUpdateSchedulerJob({ jobId, schedule, httpTargetUrl, httpTargetBody }: {
  jobId: string,
  schedule: string,
  httpTargetUrl: string,
  httpTargetBody?: any
}) {
  
  try {
    // Verifica se o job já existe
    const { exists } = await checkSchedulerJobExists({ jobId });
    
    if (exists) {
      console.log(`🔄 Job ${jobId} já existe, atualizando...`);
      return await updateSchedulerJob({ jobId, schedule, httpTargetUrl, httpTargetBody });
    } else {
      console.log(`🆕 Job ${jobId} não existe, criando...`);
      return await createSchedulerJob({ jobId, schedule, httpTargetUrl, httpTargetBody });
    }
  } catch (error) {
    console.error(`❌ Erro ao criar/atualizar job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Deleta um job do Scheduler
 */
export async function deleteSchedulerJob({ projectId, location, jobId }: {
  projectId: string,
  location: string,
  jobId: string
}) {
  const name = scheduler.jobPath(projectId, location, jobId);
  const [response] = await scheduler.deleteJob({ name });
  return response;
}

/**
 * Lista todos os jobs do Scheduler
 */
export async function listSchedulerJobs({ projectId, location }: {
  projectId: string,
  location: string
}) {
  const parent = scheduler.locationPath(projectId, location);
  const [jobs] = await scheduler.listJobs({ parent });
  return jobs;
} 