import slackService from './slackService.js';
import jibbleService from './jibbleService.js';
import userMappingService from './userMappingService.js';
import stateTrackingService from './stateTrackingService.js';

/**
 * Serviço para verificar presença dos usuários periodicamente
 * Como o Slack não oferece eventos de presence_change para bots,
 * fazemos polling (verificação periódica) da presença
 */
class PresencePollingService {
  constructor() {
    this.pollingInterval = null;
    this.pollIntervalMs = 60000; // Verifica a cada 60 segundos (1 minuto)
    this.userPresenceCache = new Map(); // Cache: userId -> { presence, lastChecked }
  }

  /**
   * Inicia o polling de presença
   */
  start() {
    if (this.pollingInterval) {
      console.log('⚠️  Polling já está rodando');
      return;
    }

    console.log(`🔄 Iniciando polling de presença (verifica a cada ${this.pollIntervalMs / 1000}s)`);
    
    // Verifica imediatamente
    this.checkAllUsersPresence();

    // Depois verifica periodicamente
    this.pollingInterval = setInterval(() => {
      this.checkAllUsersPresence();
    }, this.pollIntervalMs);
  }

  /**
   * Para o polling
   */
  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏹️  Polling de presença parado');
    }
  }

  /**
   * Verifica presença de todos os usuários mapeados
   */
  async checkAllUsersPresence() {
    const mappings = userMappingService.getAllMappings();
    
    if (mappings.length === 0) {
      console.log('ℹ️  Nenhum usuário mapeado para verificar presença');
      return;
    }

    console.log(`🔍 Verificando presença de ${mappings.length} usuário(s)...`);

    for (const mapping of mappings) {
      await this.checkUserPresence(mapping.slackUserId);
      // Pequeno delay entre verificações para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Verifica presença de um usuário específico
   * @param {string} slackUserId - ID do usuário no Slack
   */
  async checkUserPresence(slackUserId) {
    try {
      const result = await slackService.getUserPresence(slackUserId);

      if (!result.success) {
        console.warn(`⚠️  Erro ao verificar presença de ${slackUserId}:`, result.error);
        return;
      }

      const currentPresence = result.presence; // 'active' ou 'away'
      const cachedPresence = this.userPresenceCache.get(slackUserId);

      // Se é a primeira vez ou se mudou
      if (!cachedPresence || cachedPresence.presence !== currentPresence) {
        console.log(`📊 [${new Date().toISOString()}] Usuário ${slackUserId} mudou presença: ${cachedPresence?.presence || 'N/A'} → ${currentPresence}`);

        // Atualiza cache
        this.userPresenceCache.set(slackUserId, {
          presence: currentPresence,
          lastChecked: Date.now(),
        });

        // Processa a mudança
        await this.handlePresenceChange(slackUserId, currentPresence);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar presença de ${slackUserId}:`, error);
    }
  }

  /**
   * Processa mudança de presença
   * @param {string} slackUserId - ID do usuário no Slack
   * @param {string} presence - 'active' ou 'away'
   */
  async handlePresenceChange(slackUserId, presence) {
    // Se ficou online (active)
    if (presence === 'active') {
      // Previne clock-in duplicado
      if (stateTrackingService.isUserClockedIn(slackUserId)) {
        console.log(`⚠️  Usuário ${slackUserId} já está com clock-in ativo, ignorando`);
        return;
      }

      // Obtém o ID do Jibble
      const jibbleUserId = userMappingService.getJibbleUserId(slackUserId);
      if (!jibbleUserId) {
        console.warn(`⚠️  Usuário ${slackUserId} não tem mapeamento para Jibble`);
        return;
      }

      // Faz clock-in
      console.log(`🔄 Fazendo clock-in para usuário Jibble: ${jibbleUserId}`);
      const clockInResult = await jibbleService.clockIn(
        jibbleUserId,
        `Entrada automática via Slack - Usuário ficou online`
      );

      if (clockInResult.success) {
        stateTrackingService.setClockedIn(slackUserId);
        await slackService.updateUserStatus(slackUserId, 'Trabalhando', '🟢');
        console.log(`✅ Clock-in realizado com sucesso para ${slackUserId}`);
      } else {
        console.error(`❌ Falha no clock-in para ${slackUserId}:`, clockInResult.error);
      }
    }
    // Se ficou offline (away)
    else if (presence === 'away') {
      // Previne clock-out duplicado
      if (!stateTrackingService.isUserClockedIn(slackUserId)) {
        console.log(`⚠️  Usuário ${slackUserId} não está com clock-in ativo, ignorando`);
        return;
      }

      // Obtém o ID do Jibble
      const jibbleUserId = userMappingService.getJibbleUserId(slackUserId);
      if (!jibbleUserId) {
        console.warn(`⚠️  Usuário ${slackUserId} não tem mapeamento para Jibble`);
        return;
      }

      // Faz clock-out
      console.log(`🔄 Fazendo clock-out para usuário Jibble: ${jibbleUserId}`);
      const clockOutResult = await jibbleService.clockOut(
        jibbleUserId,
        `Saída automática via Slack - Usuário ficou offline`
      );

      if (clockOutResult.success) {
        stateTrackingService.setClockedOut(slackUserId);
        await slackService.clearUserStatus(slackUserId);
        console.log(`✅ Clock-out realizado com sucesso para ${slackUserId}`);
      } else {
        console.error(`❌ Falha no clock-out para ${slackUserId}:`, clockOutResult.error);
      }
    }
  }

  /**
   * Adiciona um usuário para monitoramento
   * @param {string} slackUserId - ID do usuário no Slack
   */
  addUser(slackUserId) {
    // Verifica imediatamente
    this.checkUserPresence(slackUserId);
  }

  /**
   * Remove um usuário do monitoramento
   * @param {string} slackUserId - ID do usuário no Slack
   */
  removeUser(slackUserId) {
    this.userPresenceCache.delete(slackUserId);
  }
}

export default new PresencePollingService();
