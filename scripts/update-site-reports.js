
import './env.js';
import activityAnalyzer from '../src/services/activityAnalyzer.js';
import supabaseService from '../src/services/supabaseService.js';

async function updateAllReports() {
    console.log('🔄 Iniciando consolidação e atualização de relatórios no Supabase...');

    // Lista de datas que recuperamos e queremos atualizar
    const datesToUpdate = [
        '2026-01-19',
        '2026-01-20',
        '2026-01-21',
        '2026-01-22',
        '2026-01-23',
        '2026-01-24',
        '2026-01-25',
        '2026-01-26'
    ];

    for (const date of datesToUpdate) {
        console.log(`\n📊 Processando relatório para: ${date}`);

        try {
            // 1. Buscar os eventos brutos do banco para esta data
            const { data: rawEvents, error } = await supabaseService.getRawEventsByDate(date);

            if (error) {
                console.error(`❌ Erro ao buscar eventos do dia ${date}:`, error);
                continue;
            }

            if (!rawEvents || rawEvents.length === 0) {
                console.warn(`⚠️ Nenhum evento encontrado para ${date}. Pulando...`);
                continue;
            }

            console.log(`✅ Encontrados ${rawEvents.length} eventos brutos.`);

            // 2. Transformar os metadados do banco no formato que o Analyzer espera
            const normalizedEvents = rawEvents.map(e => ({
                ...e.metadata,
                timestamp: e.slack_timestamp
            }));

            // 3. Usar o ActivityAnalyzer para processar esses eventos e gerar o objeto de relatório
            const userEvents = activityAnalyzer.groupByUser(normalizedEvents);
            const userAnalysis = [];

            for (const userId of Object.keys(userEvents)) {
                const sessions = activityAnalyzer.identifySessions(userEvents[userId]);
                const totalMinutes = sessions.reduce((sum, s) => sum + activityAnalyzer.getSessionDuration(s), 0);

                const eventTypeCounts = {};
                const messages = []; // Lista para guardar os textos

                userEvents[userId].forEach(e => {
                    eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1;

                    // Captura o texto se for uma mensagem
                    if (e.eventType === 'message' && e.text) {
                        messages.push({
                            timestamp: e.timestamp, // O site espera 'timestamp' para formatar a hora
                            channelName: e.channelId || 'canal-geral', // O site espera 'channelName'
                            text: e.text
                        });
                    }
                });

                userAnalysis.push({
                    userId,
                    userName: userEvents[userId][0].userName || userId,
                    totalEvents: userEvents[userId].length,
                    totalSessions: sessions.length,
                    totalActiveTime: totalMinutes,
                    totalActiveTimeFormatted: activityAnalyzer.formatDuration(totalMinutes),
                    eventTypeCounts,
                    messages, // Inclui as mensagens no relatório
                    sessions: sessions.map(s => ({
                        start: s.start.toISOString(),
                        end: s.end.toISOString(),
                        duration: activityAnalyzer.getSessionDuration(s),
                        durationFormatted: activityAnalyzer.formatDuration(activityAnalyzer.getSessionDuration(s)),
                        eventCount: s.events.length
                    }))
                });
            }

            // Compensação de fuso: Adicionamos 1 dia para que o site da Migma formatar corretamente (UTC vs Local)
            const compensateDate = new Date(date);
            compensateDate.setUTCDate(compensateDate.getUTCDate() + 1);
            const finalDate = compensateDate.toISOString().split('T')[0];

            const finalReport = {
                date: finalDate,
                original_date: date,
                totalEvents: normalizedEvents.length,
                uniqueUsers: userAnalysis.length,
                users: userAnalysis.sort((a, b) => b.totalActiveTime - a.totalActiveTime)
            };

            // 4. Salvar no Supabase (sobrescrevendo o antigo que estava zerado)
            const result = await supabaseService.saveReport(finalReport);

            if (result.success) {
                console.log(`✨ Relatório de ${date} atualizado com sucesso no site!`);
            } else {
                console.error(`❌ Falha ao salvar relatório de ${date}:`, result.error);
            }

        } catch (err) {
            console.error(`💥 Erro fatal ao processar ${date}:`, err.message);
        }
    }

    console.log('\n✅ Todos os relatórios foram atualizados.');
    process.exit(0);
}

// Adicionando helper no supabaseService temporariamente via injeção se não existir
if (!supabaseService.getRawEventsByDate) {
    // Pegamos a instância do client do Supabase (privada no serviço, mas acessível se modificarmos o arquivo)
    // Para simplificar o script, vamos buscar direto do banco usando o serviço de SQL se necessário, 
    // mas vou primeiro verificar se podemos estender o serviço.
}

updateAllReports();
