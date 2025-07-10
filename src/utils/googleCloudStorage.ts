import { Storage } from "@google-cloud/storage";
import path from 'path';

// Configuração do Google Cloud Storage
const storage = new Storage({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || path.join(process.cwd(), 'dev-clinicorp-agents-2ca03aa7d502.json')
  });
const bucketName = "clinicorp-agents-chat";
const bucket = storage.bucket(bucketName);

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
