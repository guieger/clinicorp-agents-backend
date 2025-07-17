import OpenAI from 'openai';
import axios from 'axios';
import { writeFileSync, unlinkSync, createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { generateSignedUrl } from '../../utils/googleGcpUtils';
import { agentService } from './agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AgentInput {
  text?: string;
  audioPath?: string;
  messageType?: 'text' | 'audio' | 'multimodal';
}

async function transcribeAudio(audioPath: string): Promise<string> {
  const signedUrl = await generateSignedUrl(audioPath);

  const response = await axios.get(signedUrl, {
    responseType: 'arraybuffer'
  });

  const audioBuffer = Buffer.from(response.data);
  const tempFilePath = join(tmpdir(), `audio_${Date.now()}.webm`);
  writeFileSync(tempFilePath, audioBuffer);

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'pt',
      response_format: 'text'
    });

    return transcription;
  } finally {
    try {
      unlinkSync(tempFilePath);
    } catch {
      // Ignora erro ao remover arquivo temporário
    }
  }
}

async function runAgentWithHistory(
  input: string,
  history: any[]
): Promise<string> {
  return await agentService.runAgentWithHistory(input, history);
}

async function runContextAgent(history: { role: string; content: string }[]): Promise<string> {
  return await agentService.processContext(history);
}


async function processHistoryMessages(messageInput: string, history: any[]): Promise<any> {
  return await runAgentWithHistory(messageInput, history);
}

async function processContext(history: any[]): Promise<any> {
  return await runContextAgent(history);
}

export { processHistoryMessages, processContext, runContextAgent };