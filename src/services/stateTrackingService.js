/**
 * Serviço para rastrear estado de clock-in/clock-out e prevenir duplicatas
 * Mantém registro de quais usuários estão com clock-in ativo
 */
class StateTrackingService {
  constructor() {
    // Mapa: slackUserId -> { isClockedIn: boolean, lastAction: timestamp }
    this.userStates = new Map();
    
    // Timeout para limpar estados antigos (opcional, prevenção de memory leak)
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldStates();
    }, 60 * 60 * 1000); // Limpa a cada hora
  }

  /**
   * Verifica se o usuário já está com clock-in ativo
   * @param {string} slackUserId - ID do usuário no Slack
   * @returns {boolean} - true se já está com clock-in ativo
   */
  isUserClockedIn(slackUserId) {
    const state = this.userStates.get(slackUserId);
    return state?.isClockedIn === true;
  }

  /**
   * Marca usuário como clock-in ativo
   * @param {string} slackUserId - ID do usuário no Slack
   */
  setClockedIn(slackUserId) {
    this.userStates.set(slackUserId, {
      isClockedIn: true,
      lastAction: Date.now(),
    });
    console.log(`📝 Estado atualizado: ${slackUserId} -> CLOCKED IN`);
  }

  /**
   * Marca usuário como clock-out (não está mais trabalhando)
   * @param {string} slackUserId - ID do usuário no Slack
   */
  setClockedOut(slackUserId) {
    this.userStates.set(slackUserId, {
      isClockedIn: false,
      lastAction: Date.now(),
    });
    console.log(`📝 Estado atualizado: ${slackUserId} -> CLOCKED OUT`);
  }

  /**
   * Obtém o estado atual do usuário
   * @param {string} slackUserId - ID do usuário no Slack
   * @returns {Object|null} - Estado do usuário ou null se não existe
   */
  getUserState(slackUserId) {
    return this.userStates.get(slackUserId) || null;
  }

  /**
   * Limpa estados antigos (mais de 24 horas)
   */
  cleanupOldStates() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    for (const [userId, state] of this.userStates.entries()) {
      if (now - state.lastAction > maxAge) {
        this.userStates.delete(userId);
        console.log(`🧹 Estado limpo para usuário ${userId} (antigo)`);
      }
    }
  }

  /**
   * Limpa todos os estados (útil para testes)
   */
  clearAll() {
    this.userStates.clear();
    console.log('🧹 Todos os estados foram limpos');
  }

  /**
   * Obtém estatísticas de uso
   * @returns {Object} - Estatísticas
   */
  getStats() {
    const total = this.userStates.size;
    const clockedIn = Array.from(this.userStates.values())
      .filter(state => state.isClockedIn).length;
    
    return {
      totalUsers: total,
      clockedInUsers: clockedIn,
      clockedOutUsers: total - clockedIn,
    };
  }
}

export default new StateTrackingService();
