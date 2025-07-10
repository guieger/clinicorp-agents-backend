import { Agent, run } from '@openai/agents';

const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant',
});

async function runAgent(prompt: string) {
  const result = await run(agent, prompt);
  return result.finalOutput;
}

export { runAgent };