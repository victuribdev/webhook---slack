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
    this.sessionGapMinutes = 30; // Se passar 30min sem evento, considera nova sessão
    this.userCache = new Map(); // Cache de informações de usuários do Slack
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
   * Gera relatório HTML visual
   * @param {Object} report - Relatório
   * @returns {string} - HTML
   */
  generateHTML(report) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Atividade - ${report.date}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.2em; opacity: 0.9; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-card h3 { color: #667eea; font-size: 2em; margin-bottom: 5px; }
    .stat-card p { color: #666; font-size: 0.9em; }
    .users { padding: 40px; }
    .user-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 30px;
      margin-bottom: 30px;
      border-left: 5px solid #667eea;
    }
    .user-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .user-id {
      font-size: 1.5em;
      font-weight: bold;
      color: #333;
    }
    .user-time {
      font-size: 1.8em;
      color: #667eea;
      font-weight: bold;
    }
    .user-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .mini-stat {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .mini-stat strong { display: block; font-size: 1.5em; color: #667eea; }
    .mini-stat span { font-size: 0.85em; color: #666; }
    .sessions {
      margin-top: 20px;
    }
    .sessions h4 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.1em;
    }
    .session {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .session-time { color: #666; font-size: 0.9em; }
    .session-duration {
      background: #667eea;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
    }
    .event-types {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 15px;
    }
    .event-badge {
      background: #e9ecef;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      color: #495057;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório de Atividade</h1>
      <p>${report.date}</p>
    </div>

    <div class="summary">
      <div class="stat-card">
        <h3>${report.totalEvents}</h3>
        <p>Total de Eventos</p>
      </div>
      <div class="stat-card">
        <h3>${report.uniqueUsers}</h3>
        <p>Usuários Ativos</p>
      </div>
      <div class="stat-card">
        <h3>${report.users.reduce((sum, u) => sum + u.totalSessions, 0)}</h3>
        <p>Sessões Totais</p>
      </div>
    </div>

    <div class="users">
      ${report.users.map(user => `
        <div class="user-card">
          <div class="user-header">
            <div>
              <div class="user-id">👤 ${user.userName || user.userId}</div>
              ${user.userEmail ? `<div style="font-size: 0.9em; color: #666; margin-top: 5px;">📧 ${user.userEmail}</div>` : ''}
            </div>
            <div class="user-time">⏱️ ${user.totalActiveTimeFormatted}</div>
          </div>

          <div class="user-stats">
            <div class="mini-stat">
              <strong>${user.totalEvents}</strong>
              <span>Eventos</span>
            </div>
            <div class="mini-stat">
              <strong>${user.totalSessions}</strong>
              <span>Sessões</span>
            </div>
            <div class="mini-stat">
              <strong>${user.eventTypeCounts.message || 0}</strong>
              <span>Mensagens</span>
            </div>
            <div class="mini-stat">
              <strong>${(user.eventTypeCounts.huddle_start || 0) + (user.eventTypeCounts.call_joined || 0)}</strong>
              <span>Calls</span>
            </div>
          </div>

          <div class="event-types">
            ${Object.entries(user.eventTypeCounts).map(([type, count]) =>
      `<span class="event-badge">${type}: ${count}</span>`
    ).join('')}
          </div>

          <div class="sessions">
            <h4>📅 Sessões de Atividade (${user.sessions.length})</h4>
            ${user.sessions.map((session, idx) => `
              <div class="session">
                <div class="session-time">
                  ${new Date(session.start).toLocaleTimeString('pt-BR')} - 
                  ${new Date(session.end).toLocaleTimeString('pt-BR')}
                  <span style="color: #999; margin-left: 10px;">(${session.eventCount} eventos)</span>
                </div>
                <div class="session-duration">${session.durationFormatted}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Relatório gerado automaticamente pelo Slack Activity Logger</p>
      <p>Modo: Sensor Passivo | Data: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
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
