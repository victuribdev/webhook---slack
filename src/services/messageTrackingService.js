import jibbleService from './jibbleService.js';
import slackService from './slackService.js';
import userMappingService from './userMappingService.js';
import stateTrackingService from './stateTrackingService.js';

/**
 * Serviço para rastrear mensagens dos usuários e fazer clock-in/out automático
 * 
 * Lógica:
 * - Quando usuário envia mensagem → Clock-In (se não estiver já clockado)
 * - Quando usuário para de enviar mensagens por X minutos → Clock-Out
 */
class MessageTrackingService {
  constructor() {
    this.userLastMessage = new Map(); // userId -> timestamp da última mensagem
    this.userLastChannel = new Map(); // userId -> channelId da última mensagem
    this.userWarningSent = new Map(); // userId -> boolean (se já enviamos aviso)
    this.inactivityTimeout = 20 * 1000; // 20 segundos em milissegundos (para testes)
    this.warningThreshold = 5 * 1000; // Avisa quando faltarem 5 segundos (para testes) - ajustar para 5min em produção
    this.checkInterval = 5 * 1000; // Verifica a cada 5 segundos (para testes mais rápidos)
    this.checkTimer = null;
  }

  /**
   * Inicia o monitoramento de inatividade
   */
  start() {
    if (this.checkTimer) {
      console.log('⚠️  Monitoramento de mensagens já está rodando');
      return;
    }

    const timeoutSeconds = this.inactivityTimeout / 1000;
    const timeoutDisplay = timeoutSeconds >= 60
      ? `${timeoutSeconds / 60}min`
      : `${timeoutSeconds}s`;
    console.log(`🔄 Iniciando monitoramento de mensagens (clock-out após ${timeoutDisplay} de inatividade)`);
    console.log(`   ⏰ Verificando a cada ${this.checkInterval / 1000}s`);

    // Verifica imediatamente na primeira vez
    this.checkInactiveUsers();

    // Depois verifica periodicamente se algum usuário ficou inativo
    this.checkTimer = setInterval(() => {
      this.checkInactiveUsers();
    }, this.checkInterval);
  }

  /**
   * Para o monitoramento
   */
  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      console.log('⏹️  Monitoramento de mensagens parado');
    }
  }

  /**
   * Registra que um usuário enviou uma mensagem
   * @param {string} slackUserId - ID do usuário no Slack
   * @param {string} channelId - ID do canal onde a mensagem foi enviada
   */
  recordMessage(slackUserId, channelId = null) {
    console.log(`📝 Registrando mensagem de ${slackUserId}`);
    const now = Date.now();
    const lastMessageTime = this.userLastMessage.get(slackUserId);

    // Atualiza timestamp da última mensagem
    this.userLastMessage.set(slackUserId, now);

    // Atualiza o canal da última mensagem (se fornecido)
    if (channelId) {
      this.userLastChannel.set(slackUserId, channelId);
    }

    // Reseta o aviso (usuário enviou mensagem, então não precisa mais avisar)
    this.userWarningSent.delete(slackUserId);

    // Se é a primeira mensagem ou se não estava clockado, faz clock-in
    if (!lastMessageTime || !stateTrackingService.isUserClockedIn(slackUserId)) {
      console.log(`   🔄 Primeira mensagem ou não está clockado - Fazendo clock-in`);
      this.handleUserActive(slackUserId);
    } else {
      console.log(`   ✅ Usuário já está clockado, apenas atualizando timestamp`);
    }
  }

  /**
   * Processa quando usuário está ativo (enviou mensagem)
   * @param {string} slackUserId - ID do usuário no Slack
   */
  async handleUserActive(slackUserId) {
    // Se já está clockado, não faz nada
    if (stateTrackingService.isUserClockedIn(slackUserId)) {
      return;
    }

    let jibbleUserId = userMappingService.getJibbleUserId(slackUserId);

    // Se não tem mapeamento, tenta mapear automaticamente
    if (!jibbleUserId) {
      console.log(`🔍 Usuário ${slackUserId} não tem mapeamento - Tentando mapear automaticamente...`);
      jibbleUserId = await this.autoMapUser(slackUserId);

      if (!jibbleUserId) {
        console.warn(`⚠️  Não foi possível mapear usuário ${slackUserId} automaticamente. Clock-in cancelado.`);
        return;
      }
    }

    console.log(`💬 [${new Date().toISOString()}] Usuário ${slackUserId} enviou mensagem - Fazendo clock-in`);

    const clockInResult = await jibbleService.clockIn(
      jibbleUserId,
      `Entrada automática via Slack - Usuário enviou mensagem`
    );

    if (clockInResult.success) {
      stateTrackingService.setClockedIn(slackUserId);
      await slackService.updateUserStatus(slackUserId, 'Trabalhando', '🟢');
      console.log(`✅ Clock-in realizado com sucesso para ${slackUserId} (enviou mensagem)`);
    } else {
      console.error(`❌ Falha no clock-in para ${slackUserId}:`, clockInResult.error);
    }
  }

  /**
   * Tenta mapear automaticamente um usuário do Slack para o Jibble usando o email
   * @param {string} slackUserId - ID do usuário no Slack
   * @returns {Promise<string|null>} - ID do usuário no Jibble ou null se não encontrado
   */
  async autoMapUser(slackUserId) {
    try {
      // Obtém informações do usuário do Slack (incluindo email)
      const slackUserInfo = await slackService.getUserInfo(slackUserId);

      if (!slackUserInfo.success || !slackUserInfo.data) {
        console.warn(`⚠️  Não foi possível obter informações do usuário Slack ${slackUserId}`);
        return null;
      }

      const slackEmail = slackUserInfo.data.profile?.email;

      if (!slackEmail) {
        console.warn(`⚠️  Usuário Slack ${slackUserId} não tem email cadastrado`);
        return null;
      }

      console.log(`🔍 Buscando usuário Jibble com email: ${slackEmail}`);

      // Busca usuário no Jibble pelo email
      const jibbleUser = await jibbleService.findUserByEmail(slackEmail);

      if (jibbleUser) {
        const jibbleUserId = jibbleUser.id || jibbleUser.personId;

        if (jibbleUserId) {
          // Cria o mapeamento automaticamente
          userMappingService.setMapping(slackUserId, jibbleUserId);
          console.log(`✅ Mapeamento automático criado: Slack ${slackUserId} (${slackEmail}) -> Jibble ${jibbleUserId}`);
          return jibbleUserId;
        }
      }

      console.warn(`⚠️  Usuário Jibble não encontrado para email: ${slackEmail}`);
      return null;
    } catch (error) {
      console.error(`❌ Erro ao mapear usuário automaticamente:`, error.message);
      return null;
    }
  }

  /**
   * Verifica usuários que ficaram inativos e faz clock-out
   */
  async checkInactiveUsers() {
    const now = Date.now();
    const mappings = userMappingService.getAllMappings();

    console.log(`🔍 [${new Date().toISOString()}] Verificando inatividade de ${mappings.length} usuário(s)...`);

    for (const mapping of mappings) {
      const slackUserId = mapping.slackUserId;
      const lastMessageTime = this.userLastMessage.get(slackUserId);
      const isClockedIn = stateTrackingService.isUserClockedIn(slackUserId);

      console.log(`   👤 Usuário ${slackUserId}:`);
      console.log(`      - Clockado: ${isClockedIn ? 'SIM' : 'NÃO'}`);
      console.log(`      - Última mensagem: ${lastMessageTime ? new Date(lastMessageTime).toLocaleTimeString() : 'Nunca'}`);

      // Se o usuário está clockado mas não enviou mensagem há X minutos
      if (lastMessageTime && isClockedIn) {
        const timeSinceLastMessage = now - lastMessageTime;
        const secondsInactive = Math.round(timeSinceLastMessage / 1000);
        const timeoutSeconds = this.inactivityTimeout / 1000;
        const warningSeconds = this.warningThreshold / 1000;

        const timeDisplay = secondsInactive >= 60
          ? `${Math.round(secondsInactive / 60)}min`
          : `${secondsInactive}s`;
        const limitDisplay = timeoutSeconds >= 60
          ? `${timeoutSeconds / 60}min`
          : `${timeoutSeconds}s`;

        console.log(`      - Tempo inativo: ${timeDisplay} (limite: ${limitDisplay})`);

        // Verifica se precisa enviar aviso (quando faltam X segundos/minutos para o clock-out)
        const timeUntilTimeout = this.inactivityTimeout - timeSinceLastMessage;
        const hasWarningBeenSent = this.userWarningSent.get(slackUserId);

        if (timeUntilTimeout <= this.warningThreshold && !hasWarningBeenSent) {
          // Envia aviso de que está prestes a fazer clock-out
          await this.sendInactivityWarning(slackUserId, timeUntilTimeout);
          this.userWarningSent.set(slackUserId, true);
        }

        if (timeSinceLastMessage >= this.inactivityTimeout) {
          console.log(`⏱️  [${new Date().toISOString()}] Usuário ${slackUserId} inativo há ${timeDisplay} - Fazendo clock-out`);
          await this.handleUserInactive(slackUserId);
        } else {
          console.log(`      ✅ Ainda dentro do limite de inatividade`);
        }
      } else {
        if (!lastMessageTime) {
          console.log(`      ⚠️  Sem registro de mensagem`);
        }
        if (!isClockedIn) {
          console.log(`      ⚠️  Não está clockado`);
        }
      }

      // Se usuário não está mapeado mas enviou mensagem recentemente, tenta mapear
      if (lastMessageTime && !userMappingService.getJibbleUserId(slackUserId)) {
        const timeSinceLastMessage = now - lastMessageTime;
        // Tenta mapear apenas se a mensagem foi enviada há menos de 1 minuto (evita spam de tentativas)
        if (timeSinceLastMessage < 60 * 1000) {
          console.log(`   🔄 Tentando mapear usuário ${slackUserId} automaticamente...`);
          await this.autoMapUser(slackUserId);
        }
      }
    }
  }

  /**
   * Processa quando usuário ficou inativo
   * @param {string} slackUserId - ID do usuário no Slack
   */
  async handleUserInactive(slackUserId) {
    if (!stateTrackingService.isUserClockedIn(slackUserId)) {
      return;
    }

    const jibbleUserId = userMappingService.getJibbleUserId(slackUserId);
    if (!jibbleUserId) {
      console.warn(`⚠️  Usuário ${slackUserId} não tem mapeamento para Jibble`);
      return;
    }

    console.log(`🔄 Fazendo clock-out para usuário Jibble: ${jibbleUserId} (inativo)`);

    const timeoutSeconds = this.inactivityTimeout / 1000;
    const timeoutDisplay = timeoutSeconds >= 60
      ? `${Math.round(timeoutSeconds / 60)}min`
      : `${timeoutSeconds}s`;

    const clockOutResult = await jibbleService.clockOut(
      jibbleUserId,
      `Saída automática via Slack - Usuário inativo há ${timeoutDisplay}`
    );

    if (clockOutResult.success) {
      this.handleSuccessfulClockOut(slackUserId);
      console.log(`✅ Clock-out realizado com sucesso para ${slackUserId} (inativo)`);
    } else {
      // Verifica se o erro é porque o usuário já estava sem clock-in no Jibble
      // Código de erro típico: invalid_interval_null_out "Não é permitido registrar saída antes de registrar entrada"
      const errorCode = clockOutResult.error?.error?.code || '';

      if (clockOutResult.status === 400 && errorCode === 'invalid_interval_null_out') {
        console.warn(`⚠️  Usuário ${slackUserId} já estava sem entrada no Jibble. Forçando status local para clock-out.`);
        this.handleSuccessfulClockOut(slackUserId);
      } else {
        console.error(`❌ Falha no clock-out para ${slackUserId}:`, clockOutResult.error);
      }
    }
  }

  /**
   * Helper para limpar estado local após clock-out (ou simulação de clock-out)
   */
  async handleSuccessfulClockOut(slackUserId) {
    stateTrackingService.setClockedOut(slackUserId);
    await slackService.clearUserStatus(slackUserId);
    // Remove do tracking de mensagens
    this.userLastMessage.delete(slackUserId);
    this.userLastChannel.delete(slackUserId);
    this.userWarningSent.delete(slackUserId);
  }

  /**
   * Envia aviso de inatividade para o usuário
   * @param {string} slackUserId - ID do usuário no Slack
   * @param {number} timeUntilTimeout - Tempo restante até o clock-out (em ms)
   */
  async sendInactivityWarning(slackUserId, timeUntilTimeout) {
    const timeRemainingSeconds = Math.round(timeUntilTimeout / 1000);
    const timeRemainingDisplay = timeRemainingSeconds >= 60
      ? `${Math.round(timeRemainingSeconds / 60)}min`
      : `${timeRemainingSeconds}s`;

    // Tenta obter o canal da última mensagem, senão envia via DM
    const channelId = this.userLastChannel.get(slackUserId);

    // Obtém informações do usuário para mencionar
    const userInfo = await slackService.getUserInfo(slackUserId);
    const userName = userInfo.success ? `<@${slackUserId}>` : 'Você';

    const warningMessage = `⏰ *Aviso de Inatividade*\n\n${userName}, você está inativo há algum tempo. O clock-out automático será realizado em *${timeRemainingDisplay}* se você não enviar uma mensagem.\n\n💡 Envie uma mensagem para continuar trabalhando!`;

    // Tenta enviar no canal onde o usuário enviou a última mensagem
    // Se não tiver canal, tenta enviar via DM (usando o ID do usuário)

    console.log(`📢 Enviando aviso de inatividade para ${slackUserId} (faltam ${timeRemainingDisplay})`);

    let result;

    if (channelId) {
      // Se temos o canal, mandamos mensagem efêmera (só o usuário vê)
      result = await slackService.sendEphemeralMessage(channelId, slackUserId, warningMessage);
      if (result.success) {
        console.log(`✅ Aviso efêmero enviado no canal ${channelId}`);
        return;
      }
    }

    // Se não temos canal ou falhou o efêmero, manda DM
    console.log(`   🔄 Tentando enviar via DM...`);
    result = await slackService.sendMessage(slackUserId, warningMessage);

    if (result.success) {
      console.log(`✅ Aviso enviado via DM para ${slackUserId}`);
    } else {
      console.error(`❌ Erro ao enviar aviso:`, result.error);
    }
  }

  /**
   * Remove um usuário do tracking
   * @param {string} slackUserId - ID do usuário no Slack
   */
  removeUser(slackUserId) {
    this.userLastMessage.delete(slackUserId);
    this.userLastChannel.delete(slackUserId);
    this.userWarningSent.delete(slackUserId);
  }
}

export default new MessageTrackingService();
