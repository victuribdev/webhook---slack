import express from 'express';
import { config } from './config/index.js';
import slackRoutes from './routes/slack.js';
// import messageTrackingService from './services/messageTrackingService.js'; // DESATIVADO - Modo Sensor Passivo
import activityLogger from './services/activityLogger.js';

const app = express();

// Middleware para parsing de raw body APENAS para eventos do Slack
// (necessário para validação de assinatura)
app.use('/slack/events', express.raw({ type: 'application/json' }));

// Middleware para parsing de JSON para outras rotas
app.use(express.json());

// Rotas
app.use('/slack', slackRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Slack Activity Logger API',
    version: '2.0.0',
    mode: 'passive_sensor',
    endpoints: {
      webhook: '/slack/events',
      mappings: '/slack/mappings',
      stats: '/slack/activity-stats',
      health: '/health',
    },
  });
});

// Inicia o servidor
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Webhook do Slack: http://localhost:${PORT}/slack/events`);
  console.log(`🌍 Configure esta URL no Slack Event Subscriptions`);
  console.log(`\n⚠️  Para desenvolvimento local, use ngrok:`);
  console.log(`   ngrok http ${PORT}`);

  console.log(`\n📊 MODO: Sensor Passivo de Atividade`);
  console.log(`   ✅ Registrando eventos silenciosamente`);
  console.log(`   ✅ Logs salvos em: data/activity-logs/`);
  console.log(`   ❌ Clock-In/Out automático DESATIVADO`);
  console.log(`   ❌ Avisos de inatividade DESATIVADOS`);

  // ============================================================================
  // CÓDIGO LEGADO (COMENTADO) - Sistema de Clock-In/Out Automático
  // ============================================================================
  /*
  // Inicia o monitoramento de mensagens para clock-in/out automático
  console.log(`\n🔄 Iniciando monitoramento automático de mensagens...`);
  console.log(`   💬 Quando você enviar uma mensagem → Clock-In automático`);
  console.log(`   ⏱️  Se não enviar mensagens por 20s → Clock-Out automático (modo teste)`);
  console.log(`   📢 Aviso enviado quando faltarem 5s para o clock-out`);
  messageTrackingService.start();
  */
});
