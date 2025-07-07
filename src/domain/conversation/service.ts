import { ConversationRepository } from './repository';

export const ConversationService = {
  async startConversation(accountId: string, patientName: string, patientPhone: string) {
    const now = new Date();

    const conversation = await ConversationRepository.create({
      AccountId: accountId,
      PatientName: patientName,
      PatientPhone: patientPhone,
      Channel: 'whatsapp',
      Status: 'open',
      StartedAt: now,
      LastMessageAt: now,
    });

    return conversation;
  },

  async closeConversation(id: string) {
    return await ConversationRepository.updateStatus(id, 'closed');
  },

  async getConversations(accountId: string) {
    return await ConversationRepository.findByAccount(accountId);
  },

  async getConversationById(id: string) {
    return await ConversationRepository.findById(id);
  },
};
