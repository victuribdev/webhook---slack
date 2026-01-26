import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase não configurado. Relatórios não serão enviados para o site.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Serviço para integração com Supabase
 */
class SupabaseService {
    constructor() {
        this.supabase = supabase;
    }
    /**
     * Salva relatório no Supabase
     * @param {Object} report - Relatório completo
     * @returns {Promise<Object>} - Resultado da operação
     */
    async saveReport(report) {
        if (!supabaseUrl || !supabaseKey) {
            return { success: false, error: 'Supabase não configurado' };
        }

        try {
            const { data, error } = await supabase
                .from('slack_activity_reports')
                .upsert({
                    date: report.date,
                    total_events: report.totalEvents,
                    unique_users: report.uniqueUsers || 0,
                    report_data: report
                }, {
                    onConflict: 'date'
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Erro ao salvar no Supabase:', error.message);
                return { success: false, error: error.message };
            }

            console.log('✅ Relatório salvo no Supabase:', report.date);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro ao conectar com Supabase:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Busca relatórios do Supabase
     * @param {number} limit - Número de relatórios para buscar
     * @returns {Promise<Object>} - Lista de relatórios
     */
    async getReports(limit = 30) {
        try {
            const { data, error } = await supabase
                .from('slack_activity_reports')
                .select('*')
                .order('date', { ascending: false })
                .limit(limit);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Busca relatório de uma data específica
     * @param {string} date - Data no formato YYYY-MM-DD
     * @returns {Promise<Object>} - Relatório
     */
    async getReportByDate(date) {
        try {
            const { data, error } = await supabase
                .from('slack_activity_reports')
                .select('*')
                .eq('date', date)
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Busca eventos brutos de uma data específica
     * @param {string} date - Data no formato YYYY-MM-DD
     */
    async getRawEventsByDate(date) {
        try {
            const { data, error } = await supabase
                .from('slack_raw_events')
                .select('*')
                .gte('slack_timestamp', `${date}T00:00:00.000Z`)
                .lt('slack_timestamp', `${date}T23:59:59.999Z`);

            if (error) return { success: false, error: error.message };
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Salva um evento bruto no banco de dados
     * @param {Object} event - Dados do evento
     */
    async saveRawEvent(event) {
        if (!supabaseUrl || !supabaseKey) return;

        try {
            const { error } = await supabase
                .from('slack_raw_events')
                .insert({
                    slack_timestamp: event.timestamp || new Date().toISOString(),
                    user_id: event.userId,
                    event_type: event.eventType,
                    channel_id: event.channelId || null,
                    metadata: event
                });

            if (error) {
                console.error('❌ Erro ao salvar evento bruto no Supabase:', error.message);
            }
        } catch (error) {
            console.error('❌ Erro de conexão ao salvar evento bruto:', error.message);
        }
    }
}

export default new SupabaseService();
