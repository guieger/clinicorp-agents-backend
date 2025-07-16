import { Agent, run, user, assistant } from '@openai/agents';

const baseAgent = new Agent({
  name: 'Agente Orquestrador',
  instructions: 'Vocé é um agente que responder a pergunta do usuário, com uma visão de entender o contexto.',
});

function formatHistoryForAgent(history: { role: string; content: string }[]) {
  return history.map(msg => {
    if (msg.role === 'user') {
      return user(msg.content);
    } else {
      return assistant(msg.content);
    }
  })
}

export class AgentService {
  private agent: Agent;

  constructor() {
    this.agent = baseAgent;
  }

  async run(prompt: string, history: { role: string; content: string }[] = []): Promise<string> {
    try {
      const formattedHistory = formatHistoryForAgent(history);

      console.log('🔥 formattedHistory >>:', formattedHistory)

      const result = await run(this.agent, formattedHistory);
      const finalOutput = result.finalOutput;
      return finalOutput || 'Resposta não disponível';
    } catch (error) {
      console.error('❌ Erro ao executar agente:', error);
      return 'Resposta não disponível';
    }
  }
}

export const agentService = new AgentService();

export const agent = {
  run: agentService.run.bind(agentService)
};
