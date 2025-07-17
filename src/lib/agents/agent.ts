import { Agent, run, user, assistant } from '@openai/agents';

const baseAgent = new Agent({
  name: 'Agente Orquestrador',
  instructions: 'Vocé é um agente que responder a pergunta do usuário, com uma visão de entender o contexto.',
});

const contextAgent = new Agent({
  name: 'Agente Contexto',
  instructions: `Vocé é que retorna o contexto da conversa, baseado no histórico de mensagens. De forma resumida e objetiva.
  O contexto deve ser uma string com no máximo 255 caracteres.
  O contexto sera salvo no banco de dados, então seja direto e objetivo.`
});

function formatHistoryForAgent(history: any[]) {
      // Inverte para ordem cronológica e transforma
      console.log('🔥 history >>:', history)

      return history.reverse().map(msg => {
        if (msg.Sender === 'user' || msg.Sender === 'patient') {
          return user(msg.Content);
        } else {
          return assistant(msg.Content);
        }
      });
}

export class AgentService {
  private agent: Agent;
  private contextAgent: Agent;

  constructor() {
    this.agent = baseAgent;
    this.contextAgent = contextAgent;
  }

  async runAgentWithHistory(prompt: string, history: any[] = []): Promise<string> {
    try {

      console.log('🔥 agent history >>:', history)
      let formattedHistory = formatHistoryForAgent(history);

      if(formattedHistory.length === 0) {
        formattedHistory = [user(prompt)];
      }

      const result = await run(this.agent, formattedHistory);
      const finalOutput = result.finalOutput;
      return finalOutput || 'Resposta não disponível';
    } catch (error) {
      console.error('❌ Erro ao executar agente:', error);
      return 'Resposta não disponível';
    }
  }

  async processContext(history: any[]): Promise<string> {
    const formattedHistory = formatHistoryForAgent(history);
    console.log('🔥 formattedHistory >>:', formattedHistory)

    const result = await run(this.contextAgent, formattedHistory);
    return result.finalOutput || 'Resposta não disponível';
  }

  async runAgent(prompt: string): Promise<string> {
    const result = await run(this.agent, [user(prompt)]);
    return result.finalOutput || 'Resposta não disponível';
  }
}

export const agentService = new AgentService();
