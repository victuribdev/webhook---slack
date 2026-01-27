import express from 'express';
import { config } from './config/index.js';
import slackRoutes from './routes/slack.js';
// import messageTrackingService from './services/messageTrackingService.js'; // DESATIVADO - Modo Sensor Passivo
import activityLogger from './services/activityLogger.js';
import slackService from './services/slackService.js';
import reportScheduler from './services/reportScheduler.js';
import presenceTracker from './services/presenceTracker.js';

const app = express();

// Middleware para parsing de raw body APENAS para eventos do Slack
// (necessário para validação de assinatura)
app.use('/slack/events', express.raw({ type: 'application/json' }));

// Middleware para parsing de JSON para outras rotas
app.use(express.json());

// Rota de health check
app.get('/', (req, res) => {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  res.json({
    status: 'online',
    mode: 'passive_sensor',
    message: 'Slack Activity Logger - Modo Sensor Passivo',
    timestamp: time,
    endpoints: {
      events: '/slack/events',
      stats: '/slack/stats',
      activityStats: '/slack/activity-stats'
    }
  });
});

// Registra as rotas do Slack
app.use('/slack', slackRoutes);

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.error(`[${time}] ❌ Erro:`, err.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicia o servidor
const PORT = config.server.port;

// Função para auto-entrar em canais públicos
async function autoJoinPublicChannels() {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`[${time}] 🔄 Verificando canais públicos...`);
  const result = await slackService.getAllChannels();

  if (result.success) {
    let joinedCount = 0;
    for (const channel of result.channels) {
      // is_member indica se o BOT é membro
      if (!channel.is_member) {
        console.log(`[${time}] ➡️  Entrando em: #${channel.name}`);
        await slackService.joinChannel(channel.id);
        joinedCount++;
      }
    }
    if (joinedCount > 0) {
      console.log(`[${time}] ✅ Entrou em ${joinedCount} novos canais`);
    } else {
      console.log(`[${time}] ✅ Já está em todos os canais públicos`);
    }
  } else {
    console.log(`[${time}] ❌ Falha ao listar canais`);
  }
}

app.listen(PORT, () => {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 SERVIDOR ATIVO`);
  console.log(`📡 Modo: Sensor Passivo de Atividade`);
  console.log(`🕐 Iniciado às: ${time}`);
  console.log(`${'-'.repeat(50)}`);
  console.log(`💡 Para desenvolvimento local, use ngrok:`);
  console.log(`   ngrok http ${PORT}`);
  console.log(`${'='.repeat(50)}\n`);

  // Inicia Auto-Join em background
  autoJoinPublicChannels();

  // Inicia agendador de relatórios automáticos
  reportScheduler.startDailySchedule();

  // Inicia rastreador de presença (Opção 2 - Inferred Presence)
  presenceTracker.start();

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
