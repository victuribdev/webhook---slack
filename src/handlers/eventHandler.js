// ============================================================================
// MODO: SENSOR PASSIVO DE ATIVIDADE
// ============================================================================
// Este handler agora funciona como um "sensor silencioso" que apenas registra
// eventos sem interagir com os usuários ou sistemas externos (Jibble).
// 
// Filosofia: Coletar dados para inferência posterior, não controle de jornada.
// ============================================================================

import activityLogger from '../services/activityLogger.js';

// ============================================================================
// CÓDIGO LEGADO (COMENTADO) - Sistema de Clock-In/Out Automático
// ============================================================================
// import jibbleService from '../services/jibbleService.js';
// import slackService from '../services/slackService.js';
// import userMappingService from '../services/userMappingService.js';
// import stateTrackingService from '../services/stateTrackingService.js';
// import messageTrackingService from '../services/messageTrackingService.js';
// import { config } from '../config/index.js';

/**
 * Processa eventos do Slack de forma passiva
 * Apenas registra eventos, sem interação com usuários ou APIs externas
 */
export class EventHandler {

  /**
   * Processa evento de mudança de presença (online/offline)
   * @param {Object} event - Evento do Slack
   */
  static async handlePresenceChange(event) {
    const { user: slackUserId, presence } = event;

    console.log(`👤 [${new Date().toISOString()}] Presença: ${slackUserId} → ${presence}`);

    // Registra o evento silenciosamente
    activityLogger.logPresenceChange(slackUserId, presence);

    // ============================================================================
    // CÓDIGO LEGADO (COMENTADO) - Clock-In/Out Automático
    // ============================================================================
    /*
    // Se usuário ficou online (active)
    if (presence === 'active') {
      // Previne clock-in duplicado
      if (stateTrackingService.isUserClockedIn(slackUserId)) {
        console.log(`⚠️  Usuário ${slackUserId} já está com clock-in ativo, ignorando evento duplicado`);
        return;
      }

      // Obtém o ID do Jibble para este usuário
      const jibbleUserId = userMappingService.getJibbleUserId(slackUserId);

      if (!jibbleUserId) {
        console.warn(`⚠️  Usuário ${slackUserId} não tem mapeamento para Jibble`);
        return;
      }

      // Faz clock-in no Jibble
      console.log(`🔄 Fazendo clock-in para usuário Jibble: ${jibbleUserId}`);
      const clockInResult = await jibbleService.clockIn(
        jibbleUserId,
        `Entrada automática via Slack - Usuário ficou online`
      );

      if (clockInResult.success) {
        // Marca como clock-in ativo
        stateTrackingService.setClockedIn(slackUserId);

        // Atualiza status no Slack
        await slackService.updateUserStatus(
          slackUserId,
          'Trabalhando',
          '🟢'
        );

        console.log(`✅ Clock-in realizado com sucesso para ${slackUserId}`);
      } else {
        console.error(`❌ Falha no clock-in para ${slackUserId}:`, clockInResult.error);
      }
    }
    // Se usuário ficou offline (away)
    else if (presence === 'away') {
      // Previne clock-out duplicado
      if (!stateTrackingService.isUserClockedIn(slackUserId)) {
        console.log(`⚠️  Usuário ${slackUserId} não está com clock-in ativo, ignorando evento duplicado`);
        return;
      }

      // Obtém o ID do Jibble para este usuário
      const jibbleUserId = userMappingService.getJibbleUserId(slackUserId);

      if (!jibbleUserId) {
        console.warn(`⚠️  Usuário ${slackUserId} não tem mapeamento para Jibble`);
        return;
      }

      // Faz clock-out no Jibble
      console.log(`🔄 Fazendo clock-out para usuário Jibble: ${jibbleUserId}`);
      const clockOutResult = await jibbleService.clockOut(
        jibbleUserId,
        `Saída automática via Slack - Usuário ficou offline`
      );

      if (clockOutResult.success) {
        // Marca como clock-out
        stateTrackingService.setClockedOut(slackUserId);

        // Limpa status no Slack
        await slackService.clearUserStatus(slackUserId);

        console.log(`✅ Clock-out realizado com sucesso para ${slackUserId}`);
      } else {
        console.error(`❌ Falha no clock-out para ${slackUserId}:`, clockOutResult.error);
      }
    }
    */
  }

  /**
   * Processa eventos de entrada em canal
   * @param {Object} event - Evento do Slack
   */
  static async handleMemberJoinedChannel(event) {
    const { user: slackUserId, channel } = event;

    console.log(`🚪 [${new Date().toISOString()}] ${slackUserId} entrou no canal ${channel}`);

    // Registra o evento silenciosamente
    activityLogger.logChannelJoin(slackUserId, channel);
  }

  /**
   * Processa eventos de saída de canal
   * @param {Object} event - Evento do Slack
   */
  static async handleMemberLeftChannel(event) {
    const { user: slackUserId, channel } = event;

    console.log(`🚪 [${new Date().toISOString()}] ${slackUserId} saiu do canal ${channel}`);

    // Registra o evento silenciosamente
    activityLogger.logChannelLeave(slackUserId, channel);
  }

  /**
   * Processa evento de mensagem enviada
   * @param {Object} event - Evento do Slack
   */
  static async handleMessage(event) {
    const { user: slackUserId, text, channel } = event;

    // Ignora mensagens de bots
    if (!slackUserId || slackUserId.startsWith('B')) {
      return;
    }

    // Ignora mensagens em threads (subtype: 'thread_broadcast' ou 'thread_message')
    if (event.subtype && (event.subtype === 'thread_broadcast' || event.subtype === 'thread_message')) {
      return;
    }

    // Ignora outros subtipos de mensagem (bot_message, channel_join, etc)
    if (event.subtype) {
      return;
    }

    console.log(`💬 [${new Date().toISOString()}] Mensagem de ${slackUserId} no canal ${channel}`);

    // Registra o evento silenciosamente
    activityLogger.logMessage(slackUserId, channel, text);

    // ============================================================================
    // CÓDIGO LEGADO (COMENTADO) - Sistema de Clock-In baseado em mensagens
    // ============================================================================
    /*
    // Registra que o usuário enviou uma mensagem (incluindo o canal)
    messageTrackingService.recordMessage(slackUserId, channel);
    */
  }

  /**
   * Processa eventos de calls (huddles)
   * @param {Object} event - Evento do Slack
   */
  static async handleCallJoined(event) {
    const { user_id: slackUserId, channel_id: channelId } = event;

    console.log(`📞 [${new Date().toISOString()}] ${slackUserId} entrou em call no canal ${channelId}`);

    // Registra o evento silenciosamente
    activityLogger.logHuddleStart(slackUserId, channelId);
  }

  /**
   * Processa eventos de saída de calls (huddles)
   * @param {Object} event - Evento do Slack
   */
  static async handleCallLeft(event) {
    const { user_id: slackUserId, channel_id: channelId } = event;

    console.log(`📞 [${new Date().toISOString()}] ${slackUserId} saiu de call no canal ${channelId}`);

    // Registra o evento silenciosamente
    activityLogger.logHuddleEnd(slackUserId, channelId);
  }

  /**
   * Processa qualquer evento do Slack
   * @param {Object} event - Evento do Slack
   */
  static async handleEvent(event) {
    switch (event.type) {
      case 'message':
        await this.handleMessage(event);
        break;

      case 'presence_change':
        await this.handlePresenceChange(event);
        break;

      case 'member_joined_channel':
        await this.handleMemberJoinedChannel(event);
        break;

      case 'member_left_channel':
        await this.handleMemberLeftChannel(event);
        break;

      // Eventos de calls/huddles
      case 'call_joined':
        await this.handleCallJoined(event);
        break;

      case 'call_left':
        await this.handleCallLeft(event);
        break;

      default:
        console.log(`ℹ️  Evento não tratado: ${event.type}`);
    }
  }
}
