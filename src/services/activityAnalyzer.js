import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import slackService from './slackService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ACTIVITY_LOG_DIR = path.join(__dirname, '../../data/activity-logs');

/**
 * Analisador de Logs de Atividade
 * Processa logs JSON e gera insights sobre atividade dos usuários
 */
class ActivityAnalyzer {
  constructor() {
    this.sessionGapMinutes = 60; // Aumentado para 60min para capturar melhor intervalos de trabalho
    this.userCache = new Map(); // Cache de informações de usuários do Slack
    this.channelCache = new Map(); // Cache de informações de canais do Slack
    this.excludeUserIds = []; // IDs de usuários para excluir (bots, testes)
  }

  /**
   * Lista todos os arquivos de log disponíveis
   * @returns {Array} - Lista de arquivos de log
   */
  listLogFiles() {
    if (!fs.existsSync(ACTIVITY_LOG_DIR)) {
      return [];
    }

    return fs.readdirSync(ACTIVITY_LOG_DIR)
      .filter(file => file.startsWith('activity-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Mais recente primeiro
  }

  /**
   * Lê eventos de um arquivo de log
   * @param {string} filename - Nome do arquivo
   * @returns {Array} - Array de eventos
   */
  readLogFile(filename) {
    const filepath = path.join(ACTIVITY_LOG_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Erro ao ler arquivo ${filename}:`, error.message);
      return [];
    }
  }

  /**
   * Agrupa eventos por usuário
   * @param {Array} events - Array de eventos
   * @returns {Object} - Eventos agrupados por userId
   */
  groupByUser(events) {
    const grouped = {};

    events.forEach(event => {
      if (!grouped[event.userId]) {
        grouped[event.userId] = [];
      }
      grouped[event.userId].push(event);
    });

    // Ordena eventos de cada usuário por timestamp
    Object.keys(grouped).forEach(userId => {
      grouped[userId].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );
    });

    return grouped;
  }

  /**
   * Identifica sessões de atividade para um usuário
   * Uma sessão é um cluster de eventos próximos (gap < sessionGapMinutes)
   * @param {Array} userEvents - Eventos de um usuário
   * @returns {Array} - Array de sessões
   */
  identifySessions(userEvents) {
    if (userEvents.length === 0) return [];

    const sessions = [];
    let currentSession = {
      start: new Date(userEvents[0].timestamp),
      end: new Date(userEvents[0].timestamp),
      events: [userEvents[0]]
    };

    for (let i = 1; i < userEvents.length; i++) {
      const event = userEvents[i];
      const eventTime = new Date(event.timestamp);
      const timeSinceLastEvent = (eventTime - currentSession.end) / 1000 / 60; // minutos

      if (timeSinceLastEvent <= this.sessionGapMinutes) {
        // Continua na mesma sessão
        currentSession.end = eventTime;
        currentSession.events.push(event);
      } else {
        // Nova sessão
        sessions.push(currentSession);
        currentSession = {
          start: eventTime,
          end: eventTime,
          events: [event]
        };
      }
    }

    // Adiciona última sessão
    sessions.push(currentSession);

    return sessions;
  }

  /**
   * Calcula duração de uma sessão em minutos
   * @param {Object} session - Sessão
   * @returns {number} - Duração em minutos
   */
  getSessionDuration(session) {
    return (session.end - session.start) / 1000 / 60;
  }

  /**
   * Formata duração em formato legível
   * @param {number} minutes - Minutos
   * @returns {string} - Formato "Xh Ymin"
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  /**
   * Busca informações do usuário no Slack (com cache)
   * @param {string} userId - ID do usuário no Slack
   * @returns {Promise<Object>} - Informações do usuário
   */
  async getUserInfo(userId) {
    // Verifica cache
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }

    try {
      const result = await slackService.getUserInfo(userId);

      if (result.success && result.data) {
        const userInfo = {
          id: userId,
          name: result.data.real_name || result.data.name || userId,
          email: result.data.profile?.email || null,
          displayName: result.data.profile?.display_name || result.data.real_name || result.data.name,
          isBot: result.data.is_bot || false
        };

        // Salva no cache
        this.userCache.set(userId, userInfo);
        return userInfo;
      }
    } catch (error) {
      console.error(`Erro ao buscar info do usuário ${userId}:`, error.message);
    }

    // Fallback se não conseguir buscar
    return {
      id: userId,
      name: userId,
      email: null,
      displayName: userId,
      isBot: false
    };
  }

  /**
   * Busca informações do canal no Slack (com cache)
   * @param {string} channelId - ID do canal no Slack
   * @returns {Promise<Object>} - Informações do canal
   */
  async getChannelInfo(channelId) {
    // Verifica cache
    if (this.channelCache.has(channelId)) {
      return this.channelCache.get(channelId);
    }

    try {
      const result = await slackService.getChannelInfo(channelId);

      if (result.success && result.data) {
        const channelInfo = {
          id: channelId,
          name: result.data.name || channelId,
          isPrivate: result.data.is_private || false
        };

        // Salva no cache
        this.channelCache.set(channelId, channelInfo);
        return channelInfo;
      }
    } catch (error) {
      console.error(`Erro ao buscar info do canal ${channelId}:`, error.message);
    }

    // Fallback se não conseguir buscar
    return {
      id: channelId,
      name: channelId,
      isPrivate: false
    };
  }

  /**
   * Define lista de usuários para excluir dos relatórios
   * @param {Array<string>} userIds - IDs de usuários para excluir
   */
  setExcludedUsers(userIds) {
    this.excludeUserIds = userIds;
  }

  /**
   * Verifica se um usuário deve ser excluído
   * @param {string} userId - ID do usuário
   * @returns {boolean}
   */
  shouldExcludeUser(userId) {
    return this.excludeUserIds.includes(userId);
  }

  /**
   * Analisa atividade de um dia específico
   * @param {string} date - Data no formato YYYY-MM-DD
   * @param {Object} options - Opções de análise
   * @returns {Promise<Object>} - Análise completa
   */
  async analyzeDate(date, options = {}) {
    const { excludeBots = true, enrichUserData = true } = options;

    const filename = `activity-${date}.json`;
    const events = this.readLogFile(filename);

    if (events.length === 0) {
      return {
        date,
        totalEvents: 0,
        users: []
      };
    }

    const userEvents = this.groupByUser(events);
    const userAnalysis = [];

    for (const userId of Object.keys(userEvents)) {
      // Pula usuários excluídos
      if (this.shouldExcludeUser(userId)) {
        continue;
      }

      // Busca informações do usuário
      let userInfo = { id: userId, name: userId, email: null, displayName: userId, isBot: false };
      if (enrichUserData) {
        userInfo = await this.getUserInfo(userId);
      }

      // Pula bots se a opção estiver ativada
      if (excludeBots && userInfo.isBot) {
        continue;
      }

      const sessions = this.identifySessions(userEvents[userId]);
      const totalMinutes = sessions.reduce((sum, session) =>
        sum + this.getSessionDuration(session), 0
      );

      // Conta tipos de eventos
      const eventTypeCounts = {};
      userEvents[userId].forEach(event => {
        eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
      });

      // Extrai histórico de mensagens
      const messagesRaw = userEvents[userId]
        .filter(event => event.eventType === 'message' && event.text);

      // Enriquece mensagens com nomes de canais (paralelo)
      const messages = await Promise.all(
        messagesRaw.map(async (event) => {
          const channelInfo = await this.getChannelInfo(event.channelId);
          return {
            timestamp: event.timestamp,
            text: event.text,
            channelId: event.channelId,
            channelName: channelInfo.name,
            isPrivate: channelInfo.isPrivate
          };
        })
      );

      userAnalysis.push({
        userId,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userDisplayName: userInfo.displayName,
        totalEvents: userEvents[userId].length,
        totalSessions: sessions.length,
        totalActiveTime: totalMinutes,
        totalActiveTimeFormatted: this.formatDuration(totalMinutes),
        eventTypeCounts,
        messages,
        sessions: sessions.map(session => ({
          start: session.start.toISOString(),
          end: session.end.toISOString(),
          duration: this.getSessionDuration(session),
          durationFormatted: this.formatDuration(this.getSessionDuration(session)),
          eventCount: session.events.length
        }))
      });
    }

    // Ordena por tempo ativo (maior primeiro)
    userAnalysis.sort((a, b) => b.totalActiveTime - a.totalActiveTime);

    return {
      date,
      totalEvents: events.length,
      uniqueUsers: userAnalysis.length,
      users: userAnalysis
    };
  }

  /**
   * Gera relatório em formato JSON
   * @param {string} date - Data no formato YYYY-MM-DD
   * @param {Object} options - Opções de análise
   * @returns {Promise<Object>} - Relatório
   */
  async generateReport(date, options = {}) {
    return await this.analyzeDate(date, options);
  }

  /**
   * Salva relatório em arquivo JSON
   * @param {Object} report - Relatório
   * @param {string} outputPath - Caminho do arquivo de saída
   */
  saveReportJSON(report, outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`✅ Relatório JSON salvo em: ${outputPath}`);
  }

  /**
   * Gera relatório HTML visual (Formato Executivo)
   * @param {Object} report - Relatório
   * @returns {string} - HTML
   */
  generateHTML(report) {
    // Função auxiliar para calcular posição na timeline (0-100%)
    const getTimelinePosition = (dateStr) => {
      const date = new Date(dateStr);
      const minutes = date.getHours() * 60 + date.getMinutes();
      return (minutes / 1440) * 100;
    };

    const getTimelineWidth = (durationMinutes) => {
      return (durationMinutes / 1440) * 100;
    };

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Produtividade - ${report.date}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4A90E2;
      --secondary: #50E3C2;
      --bg: #F7F9FC;
      --card-bg: #FFFFFF;
      --text-main: #2C3E50;
      --text-muted: #95A5A6;
      --success: #2ECC71;
      --warning: #F1C40F;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.6;
      padding: 40px 20px;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 10px;
    }
    .header p {
      color: var(--text-muted);
      font-size: 1.1rem;
    }
    .badge-date {
      background: #E1E8ED;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: 600;
      color: #34495E;
    }

    /* Summary Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .card {
      background: var(--card-bg);
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      text-align: center;
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-5px); }
    .card-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 5px;
    }
    .card-label {
      font-size: 0.9rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* User Rows */
    .user-row {
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      margin-bottom: 30px;
      overflow: hidden;
    }
    
    .user-header {
      padding: 25px;
      border-bottom: 1px solid #EEF2F7;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .user-info {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    .avatar-circle {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: bold;
    }
    .user-name {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .user-email {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .user-meta {
      display: flex;
      gap: 30px;
    }
    .meta-item {
      text-align: right;
    }
    .meta-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--primary);
    }
    .meta-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    /* Visual Timeline */
    .timeline-wrapper {
      padding: 20px 25px;
      background: #FAFBFC;
      border-bottom: 1px solid #EEF2F7;
    }
    .timeline-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 10px;
      font-weight: 600;
    }
    .timeline-track {
      position: relative;
      height: 24px;
      background: #EDF2F7;
      border-radius: 12px;
      width: 100%;
      overflow: hidden;
    }
    .timeline-bar {
      position: absolute;
      height: 100%;
      background: linear-gradient(90deg, #4A90E2 0%, #63B3ED 100%);
      border-radius: 4px;
      opacity: 0.9;
    }
    .timeline-ruler {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      color: #CBD5E0;
      font-size: 0.7rem;
    }

    /* Activities Breakdown */
    .activities-breakdown {
      padding: 20px 25px;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    .tag {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tag:hover { transform: translateY(-2px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .tag-msg { background: #E3F2FD; color: #1565C0; }
    .tag-call { background: #E8F5E9; color: #2E7D32; }
    .tag-session { background: #F3E5F5; color: #7B1FA2; }

    /* Session Details (collapsible) */
    .session-details {
      margin-top: 15px;
      padding: 15px 25px;
      background: #F8F9FA;
      border-radius: 8px;
      display: none;
      animation: fadeIn 0.3s;
    }
    .session-details.active { display: block; }
    .session-item {
      padding: 10px 0;
      border-bottom: 1px solid #E9ECEF;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .session-item:last-child { border-bottom: none; }
    .session-time-range {
      font-weight: 600;
      color: var(--text-main);
    }
    .session-event-count {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 50px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório de Produtividade</h1>
      <p>Resumo de Atividade do Dia • <span class="badge-date">${report.date}</span></p>
    </div>

    <!-- Resumo Global -->
    <div class="summary-grid">
      <div class="card">
        <div class="card-value">${report.users.length}</div>
        <div class="card-label">Colaboradores Ativos</div>
      </div>
      <div class="card">
        <div class="card-value">${(report.users.reduce((sum, u) => sum + u.totalActiveTime, 0) / 60).toFixed(1)}h</div>
        <div class="card-label">Horas de Atividade</div>
      </div>
      <div class="card">
        <div class="card-value">${report.users.reduce((sum, u) => sum + (u.eventTypeCounts.message || 0), 0)}</div>
        <div class="card-label">Mensagens Enviadas</div>
      </div>
    </div>

    <!-- Lista de Usuários -->
    ${report.users.map((user, userIdx) => `
      <div class="user-row">
        <!-- Cabeçalho do Usuário -->
        <div class="user-header">
          <div class="user-info">
            <div class="avatar-circle">${(user.userName || user.userId).charAt(0).toUpperCase()}</div>
            <div>
              <div class="user-name">${user.userName || user.userId}</div>
              ${user.userEmail ? `<div class="user-email">${user.userEmail}</div>` : ''}
            </div>
          </div>
          <div class="user-meta">
            <div class="meta-item">
              <div class="meta-value">${user.totalActiveTimeFormatted}</div>
              <div class="meta-label">Tempo Estimado</div>
            </div>
          </div>
        </div>

        <!-- Linha do Tempo Visual (24 horas) -->
        <div class="timeline-wrapper">
          <div class="timeline-label">🕐 Linha do Tempo (24 horas)</div>
          <div class="timeline-track">
            ${user.sessions.map(session => `
              <div class="timeline-bar" 
                   style="left: ${getTimelinePosition(session.start)}%; width: max(0.5%, ${getTimelineWidth(session.duration)}%);"
                   title="Atividade: ${new Date(session.start).toLocaleTimeString().slice(0, 5)} - ${new Date(session.end).toLocaleTimeString().slice(0, 5)}">
              </div>
            `).join('')}
          </div>
          <div class="timeline-ruler">
            <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span>
          </div>
        </div>

        <!-- Resumo Simplificado (clicável) -->
        <div class="activities-breakdown">
          <div class="tag tag-session" onclick="toggleDetails('sessions-${userIdx}')">
            <span>🔥</span> ${user.totalSessions} blocos de trabalho
          </div>
          <div class="tag tag-msg" onclick="toggleDetails('messages-${userIdx}')">
            <span>💬</span> ${user.eventTypeCounts.message || 0} mensagens
          </div>
          ${((user.eventTypeCounts.huddle_start || 0) + (user.eventTypeCounts.call_joined || 0)) > 0 ? `
          <div class="tag tag-call">
            <span>📞</span> ${(user.eventTypeCounts.huddle_start || 0) + (user.eventTypeCounts.call_joined || 0)} reuniões/calls
          </div>` : ''}
        </div>

        <!-- Detalhes das Sessões (expansível) -->
        <div id="sessions-${userIdx}" class="session-details">
          <h4 style="margin-bottom: 15px; color: var(--text-main); font-size: 0.95rem;">📅 Detalhes dos Blocos de Trabalho</h4>
          ${user.sessions.map((session, idx) => `
            <div class="session-item">
              <div>
                <div class="session-time-range">
                  ${new Date(session.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                  ${new Date(session.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="session-event-count">${session.eventCount} interações registradas</div>
              </div>
              <div style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                ${session.durationFormatted}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Histórico de Mensagens (expansível) -->
        <div id="messages-${userIdx}" class="session-details">
          <h4 style="margin-bottom: 15px; color: var(--text-main); font-size: 0.95rem;">💬 Histórico de Mensagens</h4>
          ${user.messages && user.messages.length > 0 ? user.messages.map((msg, idx) => `
            <div class="session-item" style="flex-direction: column; align-items: flex-start;">
              <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 8px;">
                <span style="font-size: 0.85rem; color: var(--text-muted);">
                  ${new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">
                  ${msg.isPrivate ? '🔒' : '#'}${msg.channelName}
                </span>
              </div>
              <div style="background: #F8F9FA; padding: 10px; border-radius: 8px; width: 100%; border-left: 3px solid #4A90E2;">
                <p style="margin: 0; color: var(--text-main); font-size: 0.9rem; line-height: 1.5;">${msg.text}</p>
              </div>
            </div>
          `).join('') : '<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma mensagem com texto registrada</p>'}
        </div>
      </div>
    `).join('')}

    <div class="footer">
      <p>💼 Relatório gerado automaticamente</p>
      <p style="margin-top: 5px; font-size: 0.8rem;">Este relatório não implica controle de jornada ou cobrança por horas</p>
    </div>
  </div>

  <script>
    function toggleDetails(id) {
      const element = document.getElementById(id);
      element.classList.toggle('active');
    }
  </script>
</body>
</html>
    `;

    return html;
  }

  /**
   * Salva relatório HTML
   * @param {Object} report - Relatório
   * @param {string} outputPath - Caminho do arquivo de saída
   */
  saveReportHTML(report, outputPath) {
    const html = this.generateHTML(report);
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`✅ Relatório HTML salvo em: ${outputPath}`);
  }
}

export default new ActivityAnalyzer();
