import { prisma } from '../../config/database';

export const ConversationRepository = {
  async create(conversation: {
    AccountId: string;
    PatientName: string;
    PatientPhone: string;
    Channel: string;
    Status: string;
    StartedAt: Date;
    LastMessageAt: Date;
  }) {
    return await prisma.conversations.create({
      data: {
        ...conversation,
      },
    }); 
  },

  async findById(id: string) {
    return await prisma.conversations.findUnique({
      where: { Id: id },
      include: { messages: true },
    });
  },

  async findByAccount(accountId: string) {
    return await prisma.conversations.findMany({
      where: { AccountId: accountId },
    });
  },

  async updateStatus(id: string, status: string) {
    return await prisma.conversations.update({
      where: { Id: id },
      data: { Status: status },
    });
  },
};
