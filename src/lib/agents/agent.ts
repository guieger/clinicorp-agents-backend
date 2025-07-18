export class AgentService {
  private agent: any;
  private runFn: any;
  private userFn: any;
  private assistantFn: any;

  private async ensureLibsLoaded() {
    if (!this.agent) {
      const agents = await import('@openai/agents');
      const { Agent, run, user, assistant } = agents;

      this.agent = new Agent({
        name: 'Agente Orquestrador',
        instructions: 'Vocé é um agente que responder a pergunta do usuário, com uma visão de entender o contexto.',
      });

      this.runFn = run;
      this.userFn = user;
      this.assistantFn = assistant;
    }
  }

  private async formatHistoryForAgent(history: { role: string; content: string }[]) {
    await this.ensureLibsLoaded();
    return history.map(msg =>
      msg.role === 'user' ? this.userFn(msg.content) : this.assistantFn(msg.content)
    );
  }

  async run(prompt: string, history: { role: string; content: string }[] = []): Promise<string> {
    try {
      const formattedHistory = await this.formatHistoryForAgent(history);

      console.log('🔥 formattedHistory >>:', formattedHistory);

      const result = await this.runFn(this.agent, formattedHistory);
      return result.finalOutput || 'Resposta não disponível';
    } catch (error) {
      console.error('❌ Erro ao executar agente:', error);
      return 'Resposta não disponível';
    }
  }
}

export const agentService = new AgentService();

export const agent = {
  run: agentService.run.bind(agentService),
};
