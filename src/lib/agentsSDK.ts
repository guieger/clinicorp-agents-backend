import { Agent, run } from '@openai/agents';
import OpenAI from 'openai';
import axios from 'axios';
import { writeFileSync, unlinkSync, createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { MessageProcessor } from './messageProcessor';
import { generateSignedUrl } from '../utils/googleCloudStorage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant',
});

interface AgentInput {
  text?: string;
  audioPath?: string;
  messageType?: 'text' | 'audio' | 'multimodal';
}

interface MessageInput {
  message: string;
  externalAudioUrl?: string;
  providerMessageId: string;
}

async function transcribeAudio(audioPath: string): Promise<string> {
  // Gera uma URL assinada para baixar o arquivo
  const signedUrl = await generateSignedUrl(audioPath);

  // Baixa o arquivo usando a URL assinada
  const response = await axios.get(signedUrl, {
    responseType: 'arraybuffer'
  });

  const audioBuffer = Buffer.from(response.data);

  // Cria um arquivo temporário no sistema
  const tempFilePath = join(tmpdir(), `audio_${Date.now()}.webm`);
  writeFileSync(tempFilePath, audioBuffer);

  try {
    // Faz a transcrição usando o Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'pt',
      response_format: 'text'
    });

    return transcription;
  } finally {
    // Remove o arquivo temporário
    try {
      unlinkSync(tempFilePath);
    } catch {
      // Ignora erro ao remover arquivo temporário
    }
  }
}

async function runAgent(input: AgentInput | string): Promise<string> {
  let finalPrompt: string;

  // Se for string, mantém compatibilidade com código existente
  if (typeof input === 'string') {
    finalPrompt = `Responda essa mensagem: ${input}`;
  } else {
    const { text, audioPath, messageType } = input;
    
    if (messageType === 'audio' && audioPath) {
      const transcription = await transcribeAudio(audioPath);
      finalPrompt = `Responda essa mensagem de áudio transcrita: ${transcription}`;
    } else if (messageType === 'multimodal' && audioPath && text?.trim()) {
      const transcription = await transcribeAudio(audioPath);
      finalPrompt = `Responda essa mensagem multimodal. Texto: "${text.trim()}". Áudio transcrito: "${transcription}"`;
    } else if (text?.trim()) {
      finalPrompt = `Responda essa mensagem: ${text.trim()}`;
    } else {
      throw new Error('Nenhum conteúdo válido fornecido para processamento');
    }
  }

  const result = await run(agent, finalPrompt);
  return result.finalOutput || 'Resposta não disponível';
}

async function processMessage(messageInput: MessageInput): Promise<string> {
  const agentInput = await MessageProcessor.processMessage(messageInput);
  return await runAgent(agentInput);
}

export { runAgent, processMessage };