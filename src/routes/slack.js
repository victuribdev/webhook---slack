import express from 'express';
import { EventHandler } from '../handlers/eventHandler.js';
import { slackAuthMiddleware } from '../middleware/slackAuth.js';
import userMappingService from '../services/userMappingService.js';
import stateTrackingService from '../services/stateTrackingService.js';
import activityLogger from '../services/activityLogger.js';

const router = express.Router();

/**
 * Endpoint de teste (SEM autenticação) para debug
 * Use apenas para desenvolvimento!
 */
router.post('/events-test', express.json(), (req, res) => {
  console.log('🧪 TESTE - Requisição recebida (sem autenticação)');
  console.log('   📦 Body:', JSON.stringify(req.body, null, 2));
  res.json({ received: true });
});

/**
 * Endpoint para receber eventos do Slack
 * Este endpoint precisa estar configurado no Slack Event Subscriptions
 */
router.post('/events', slackAuthMiddleware, async (req, res) => {
  console.log(`🔔 [${new Date().toISOString()}] Requisição recebida em /slack/events`);
  console.log(`   📦 Body type:`, req.body?.type);
  console.log(`   📦 Body keys:`, Object.keys(req.body || {}));

  // O body já foi parseado pelo middleware de autenticação
  const { type, challenge, event } = req.body;

  // URL Verification (quando você configura o webhook pela primeira vez)
  if (type === 'url_verification') {
    console.log('✅ Verificação de URL do Slack');
    return res.json({ challenge });
  }

  // Event Callback
  if (type === 'event_callback' && event) {
    console.log(`📨 [${new Date().toISOString()}] Evento recebido: ${event.type}`);
    console.log(`   📝 Detalhes:`, JSON.stringify({
      type: event.type,
      user: event.user,
      channel: event.channel,
      subtype: event.subtype,
      text: event.text ? event.text.substring(0, 50) + '...' : 'N/A'
    }, null, 2));

    // Processa o evento de forma assíncrona
    EventHandler.handleEvent(event).catch((error) => {
      console.error(`❌ [${new Date().toISOString()}] Erro ao processar evento:`, error);
    });

    // Responde imediatamente ao Slack (dentro de 3 segundos)
    res.sendStatus(200);
    return;
  }

  // Evento desconhecido
  console.log(`⚠️  [${new Date().toISOString()}] Tipo de evento desconhecido:`, type);
  console.log(`   📦 Body completo:`, JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

/**
 * Endpoint para obter estatísticas de atividade do dia
 * GET /slack/activity-stats
 */
router.get('/activity-stats', (req, res) => {
  const stats = activityLogger.getTodayStats();
  res.json({
    date: new Date().toISOString().split('T')[0],
    ...stats
  });
});

/**
 * Endpoint para listar mapeamentos de usuários (útil para debug/admin)
 */
router.get('/mappings', (req, res) => {
  const mappings = userMappingService.getAllMappings();
  res.json({ mappings });
});

/**
 * Endpoint para obter estatísticas de estado (útil para debug/admin)
 * NOTA: Este endpoint é do sistema legado (clock-in/out)
 */
router.get('/stats', (req, res) => {
  const stats = stateTrackingService.getStats();
  res.json({
    stats,
    note: 'Este endpoint é do sistema legado de clock-in/out (atualmente desativado)'
  });
});

/**
 * Endpoint para criar/atualizar mapeamento de usuário
 * POST /slack/mappings
 * Body: { slackUserId: "U123", jibbleUserId: "jibble-123" }
 */
router.post('/mappings', (req, res) => {
  const { slackUserId, jibbleUserId } = req.body;

  if (!slackUserId || !jibbleUserId) {
    return res.status(400).json({
      error: 'slackUserId e jibbleUserId são obrigatórios',
    });
  }

  userMappingService.setMapping(slackUserId, jibbleUserId);
  res.json({
    success: true,
    message: 'Mapeamento criado com sucesso',
    mapping: { slackUserId, jibbleUserId },
  });
});

export default router;
