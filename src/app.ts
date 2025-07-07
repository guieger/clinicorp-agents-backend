import express from 'express';
import messageRoutes from './routes/messageRoutes';
import cors from 'cors';
import webhookRoutes from './routes/webhookRoutes';
import conversationRoutes from './routes/conversationRoutes';
import configRoutes from './routes/configRoutes';

const app = express();
app.use(cors()); // Permite todas as origens (ideal só para desenvolvimento)

app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());

// 📤 Envio de mensagens
app.use('/api/messaging', messageRoutes);

// Conversas
app.use('/api/conversation', conversationRoutes);

// 📥 Recebimento de webhooks
app.use('/api/webhook', webhookRoutes);

// Configurações 
app.use('/api/config', configRoutes);


// Health check
app.get('/', (req, res) => {
  res.send('Message Sender Service is running 🚀');
});

export default app;
