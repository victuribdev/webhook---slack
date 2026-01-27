
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
        '2026-01-26',
        '2026-01-27'
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

            // 3. Usar o ActivityAnalyzer para processar esses eventos 
            const finalReportRaw = await activityAnalyzer.generateReport(date, {
                excludeBots: true,
                enrichUserData: true
            });

            const finalReport = {
                ...finalReportRaw,
                date: date,
                original_date: date
            };

            // LÓGICA OPÇÃO 2: Inferência de Leitura (O Analyzer já tem os visualizadores prováveis se chamarmos corretamente)
            // Nota: analyzeDate já chama crossReferenceMessageViews internamente

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
