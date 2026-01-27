import supabaseService from './supabaseService.js';

/**
 * Serviço para registrar atividades dos usuários de forma passiva direto na Nuvem
 */
class ActivityLogger {
    constructor() {
        this.eventBuffer = [];
        this.flushInterval = 10000; // 10 segundos
        this.startAutoFlush();
    }

    /**
     * Registra um evento de atividade
     */
    logActivity(userId, eventType, metadata = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            userId,
            eventType,
            ...metadata
        };

        this.eventBuffer.push(event);
    }

    /**
     * Envia eventos do buffer para o Supabase
     */
    async flush() {
        if (this.eventBuffer.length === 0) return;

        const eventsToSend = [...this.eventBuffer];
        this.eventBuffer = []; // Limpa logo para não duplicar se falhar

        try {
            // Salva no Supabase para persistência definitiva
            await Promise.all(eventsToSend.map(event => supabaseService.saveRawEvent(event)));
        } catch (error) {
            console.error('❌ Erro de sincronização Cloud:', error.message);
            // Em caso de erro, re-insere no buffer para tentar depois
            this.eventBuffer = [...eventsToSend, ...this.eventBuffer];
        }
    }

    startAutoFlush() {
        setInterval(() => this.flush(), this.flushInterval);
        console.log(`🔄 [ActivityLogger] Cloud-Sync ativado (${this.flushInterval / 1000}s)`);
    }

    // Métodos de conveniência
    logMessage(userId, channelId, text = null) {
        this.logActivity(userId, 'message', { channelId, text: text || '', textLength: text ? text.length : 0 });
    }

    logChannelJoin(userId, channelId) { this.logActivity(userId, 'channel_join', { channelId }); }
    logChannelLeave(userId, channelId) { this.logActivity(userId, 'channel_leave', { channelId }); }
    logPresenceChange(userId, presence) { this.logActivity(userId, 'presence_change', { presence }); }
    logHuddleStart(userId, channelId) { this.logActivity(userId, 'huddle_start', { channelId }); }
    logHuddleEnd(userId, channelId) { this.logActivity(userId, 'huddle_end', { channelId }); }
    logScreenShare(userId, channelId) { this.logActivity(userId, 'screen_share', { channelId }); }

    /**
     * Estatísticas de hoje direto do banco (Async agora)
     */
    async getTodayStats() {
        const brDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        const { data, success } = await supabaseService.getRawEventsByDate(brDate);

        if (!success) return { totalEvents: 0, uniqueUsers: 0, eventTypes: {} };

        const uniqueUsers = new Set(data.map(e => e.user_id)).size;
        const eventTypes = data.reduce((acc, e) => {
            acc[e.event_type] = (acc[e.event_type] || 0) + 1;
            return acc;
        }, {});

        return {
            totalEvents: data.length,
            uniqueUsers,
            eventTypes
        };
    }
}

export default new ActivityLogger();
