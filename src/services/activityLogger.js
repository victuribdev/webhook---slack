import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ACTIVITY_LOG_DIR = path.join(__dirname, '../../data/activity-logs');
const DAILY_LOG_FILE = path.join(ACTIVITY_LOG_DIR, `activity-${new Date().toISOString().split('T')[0]}.json`);

/**
 * Serviço para registrar atividades dos usuários de forma passiva
 * Não interage com os usuários, apenas registra eventos silenciosamente
 * 
 * Filosofia: "Sensor Passivo" - Coleta dados para inferência posterior
 */
class ActivityLogger {
    constructor() {
        this.ensureLogDirectory();
        this.eventBuffer = []; // Buffer em memória para performance
        this.flushInterval = 10000; // Salva em disco a cada 10 segundos
        this.startAutoFlush();
    }

    /**
     * Garante que o diretório de logs existe
     */
    ensureLogDirectory() {
        if (!fs.existsSync(ACTIVITY_LOG_DIR)) {
            fs.mkdirSync(ACTIVITY_LOG_DIR, { recursive: true });
            console.log(`📁 Diretório de logs criado: ${ACTIVITY_LOG_DIR}`);
        }
    }

    /**
     * Registra um evento de atividade
     * @param {string} userId - ID do usuário no Slack
     * @param {string} eventType - Tipo de evento (message, huddle_join, presence_change, etc)
     * @param {Object} metadata - Dados adicionais do evento
     */
    logActivity(userId, eventType, metadata = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            userId,
            eventType,
            ...metadata
        };

        this.eventBuffer.push(event);

        // Log silencioso (não polui console)
        console.log(`📊 [ActivityLogger] ${eventType} - ${userId}`);
    }

    /**
     * Salva eventos do buffer em disco
     */
    async flush() {
        if (this.eventBuffer.length === 0) {
            return;
        }

        try {
            // Lê arquivo existente (se houver)
            let existingEvents = [];
            if (fs.existsSync(DAILY_LOG_FILE)) {
                const content = fs.readFileSync(DAILY_LOG_FILE, 'utf8');
                existingEvents = JSON.parse(content);
            }

            // Adiciona novos eventos
            const allEvents = [...existingEvents, ...this.eventBuffer];

            // Salva de volta
            fs.writeFileSync(DAILY_LOG_FILE, JSON.stringify(allEvents, null, 2), 'utf8');

            console.log(`💾 [ActivityLogger] ${this.eventBuffer.length} evento(s) salvos em disco`);

            // Limpa buffer
            this.eventBuffer = [];
        } catch (error) {
            console.error('❌ Erro ao salvar logs de atividade:', error.message);
        }
    }

    /**
     * Inicia salvamento automático periódico
     */
    startAutoFlush() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);

        console.log(`🔄 [ActivityLogger] Auto-flush ativado (a cada ${this.flushInterval / 1000}s)`);
    }

    /**
     * Registra mensagem enviada
     */
    logMessage(userId, channelId, text = null) {
        this.logActivity(userId, 'message', {
            channelId,
            hasText: !!text,
            textLength: text ? text.length : 0
        });
    }

    /**
     * Registra entrada em canal
     */
    logChannelJoin(userId, channelId) {
        this.logActivity(userId, 'channel_join', { channelId });
    }

    /**
     * Registra saída de canal
     */
    logChannelLeave(userId, channelId) {
        this.logActivity(userId, 'channel_leave', { channelId });
    }

    /**
     * Registra mudança de presença (online/offline)
     */
    logPresenceChange(userId, presence) {
        this.logActivity(userId, 'presence_change', { presence });
    }

    /**
     * Registra início de huddle/call
     */
    logHuddleStart(userId, channelId) {
        this.logActivity(userId, 'huddle_start', { channelId });
    }

    /**
     * Registra fim de huddle/call
     */
    logHuddleEnd(userId, channelId) {
        this.logActivity(userId, 'huddle_end', { channelId });
    }

    /**
     * Registra compartilhamento de tela
     */
    logScreenShare(userId, channelId) {
        this.logActivity(userId, 'screen_share', { channelId });
    }

    /**
     * Obtém estatísticas do dia atual
     */
    getTodayStats() {
        try {
            if (!fs.existsSync(DAILY_LOG_FILE)) {
                return { totalEvents: 0, uniqueUsers: 0, eventTypes: {} };
            }

            const content = fs.readFileSync(DAILY_LOG_FILE, 'utf8');
            const events = JSON.parse(content);

            const uniqueUsers = new Set(events.map(e => e.userId)).size;
            const eventTypes = events.reduce((acc, e) => {
                acc[e.eventType] = (acc[e.eventType] || 0) + 1;
                return acc;
            }, {});

            return {
                totalEvents: events.length,
                uniqueUsers,
                eventTypes
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return { totalEvents: 0, uniqueUsers: 0, eventTypes: {} };
        }
    }
}

export default new ActivityLogger();
