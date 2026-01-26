
import './scripts/env.js';
import supabaseService from './src/services/supabaseService.js';
import activityAnalyzer from './src/services/activityAnalyzer.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncAndReport() {
    const targetDate = '2026-01-26';
    console.log(`\n🔍 Buscando eventos do Supabase para ${targetDate}...\n`);

    const { data: events, error } = await supabaseService.supabase
        .from('slack_raw_events')
        .select('*')
        .gte('created_at', `${targetDate}T00:00:00Z`)
        .lte('created_at', `${targetDate}T23:59:59Z`)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('❌ Erro ao buscar eventos:', error.message);
        return;
    }

    console.log(`✅ ${events.length} eventos encontrados no Supabase.`);

    if (events.length === 0) {
        console.log('⚠️ Nenhum evento para processar.');
        return;
    }

    // Mapeia para o formato esperado pelo Analyzer
    const formattedEvents = events.map(e => ({
        timestamp: e.slack_timestamp || e.created_at,
        userId: e.user_id,
        eventType: e.event_type,
        channelId: e.channel_id,
        text: e.metadata?.text || '',
        userName: e.metadata?.userName || null
    }));

    // Salva localmente para que o Analyzer possa ler
    const logDir = path.join(__dirname, 'data/activity-logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const logFile = path.join(logDir, `activity-${targetDate}.json`);
    fs.writeFileSync(logFile, JSON.stringify(formattedEvents, null, 2));
    console.log(`💾 Arquivo de log local atualizado em: ${logFile}`);

    // Agora gera o relatório
    console.log(`📊 Gerando relatório consolidado...`);
    const report = await activityAnalyzer.generateReport(targetDate, {
        excludeBots: true,
        enrichUserData: true
    });

    const reportsDir = path.join(__dirname, 'data/reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const htmlPath = path.join(reportsDir, `report-${targetDate}.html`);
    activityAnalyzer.saveReportHTML(report, htmlPath);

    // Salva no Supabase também para atualizar o Dashboard
    await supabaseService.saveReport(report);

    console.log(`\n✨ SUCESSO! O relatório de ${targetDate} foi atualizado com todos os dados do Supabase.`);
    console.log(`🌐 HTML disponível em: ${htmlPath}`);

    // Mostra as últimas mensagens do #dev do dia 26
    const devMessages = formattedEvents.filter(e => e.channelId === 'C0A88AC961Z' || e.channelId === 'dev');
    console.log(`\n💬 Mensagens detectadas no #dev (${devMessages.length}):`);
    devMessages.slice(-10).forEach(m => {
        console.log(`   [${new Date(m.timestamp).toLocaleTimeString()}] ${m.text}`);
    });
}

syncAndReport();
