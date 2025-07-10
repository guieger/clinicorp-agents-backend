interface StandardPayload {
  patientPhone: string;
  message: string;
  clientPhone: string;
  senderName: string;
  sender: string;
  providerMessageId: string;
  audioUrl?: string;
  fromMe?: boolean;
}

export function translateWebhookPayload(provider: string, _payload: any): StandardPayload {

  // Formato padrão (já está correto)
  if (provider === 'zapi') {
    return {
      patientPhone: _payload.phone,
      message: _payload.message,
      clientPhone: _payload.connectedPhone,
      senderName: _payload.senderName,
      sender: 'patient',
      providerMessageId: _payload.messageId || _payload.id || '',
      audioUrl: _payload.audioUrl || '',
      fromMe: _payload.fromMe || false
    };
  }

  // Se não reconhecer nenhum formato, retorna o original ou lança erro
  throw new Error('Formato de payload não reconhecido');
} 