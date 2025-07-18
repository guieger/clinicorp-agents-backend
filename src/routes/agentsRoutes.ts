import { Router } from 'express';

const router = Router();

const AGENT_MOCK_1 = {
    id: '1',
    name: 'Agente Geraldo',
    description: 'Descrição 1',
    toneOfVoice: 'amigável',
    instructions: 'Você é um agente amigável',
    tools: [
        {
            name: 'ferramenta1',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            }
        }
    ],
    guardRails: [
        {
            name: 'restricao1',
            description: 'Restrição 1',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            }
        }
    ]
}

const AGENT_MOCK_2 = {
    id: '2',
    name: 'Agente Especialista',
    description: 'Especialista em suporte técnico',
    toneOfVoice: 'professional',
    instructions: 'Ajude o usuário a resolver problemas técnicos de forma clara e objetiva.',
    tools: [
        {
            name: 'diagnostic_tool',
            parameters: {
                type: 'object',
                properties: {
                    issue: { type: 'string' },
                    urgency: { type: 'string' }
                }
            }
        }
    ],
    guardRails: [
        {
            name: 'no_personal_data',
            description: 'Não solicitar dados pessoais do usuário',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    ]
}

const AGENT_MOCK_3 = {
    id: '3',
    name: 'Agente de vendas maneiro',
    description: 'Agente de vendas focado em upsell',
    toneOfVoice: 'persuasive',
    instructions: 'Ofereça produtos complementares de forma sutil e amigável.',
    tools: [
        {
            name: 'upsell_suggester',
            parameters: {
                type: 'object',
                properties: {
                    productId: { type: 'string' },
                    customerType: { type: 'string' }
                }
            }
        }
    ],
    guardRails: [
        {
            name: 'no_false_promises',
            description: 'Não fazer promessas falsas sobre produtos',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    ]
}

const AGENT_MOCK_LIST = [
    AGENT_MOCK_1,
    AGENT_MOCK_2,
    AGENT_MOCK_3
]

router.post('/', async (req, res) => {

    // TODO: Implementar a criação do agente
    
    return res.status(200).json(req.body);

});

router.get('/', async (req, res) => {

    // TODO: Implementar a listagem dos agentes
    
    
    return res.status(200).json(AGENT_MOCK_LIST);

});

router.put('/:id', async (req, res) => {

    const { id } = req.params;
    const { name, description, toneOfVoice, instructions, tools, guardRails } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Agent ID is required' });
    }

    if (!name || !description || !toneOfVoice || !instructions || !tools || !guardRails) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // TODO: Implementar a edição do agente

    return res.status(200).json({ message: 'Agent edited successfully' });

});

router.delete('/:id', async (req, res) => {

    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Agent ID is required' });
    }

    const agent = AGENT_MOCK_LIST.find(agent => agent.id === id);

    if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
    }

    return res.status(200).json({ message: 'Agent deleted successfully' });

});

export default router;