import cron from 'node-cron';
import activityAnalyzer from './activityAnalyzer.js';
import supabaseService from './supabaseService.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.join(__dirname, '../../data/reports');

class ReportScheduler {
    constructor() {
        this.ensureReportsDirectory();
    }

    ensureReportsDirectory() {
        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }
    }

    /**
     * Gera ou atualiza o relatório do dia atual para o Dashboard (Tempo Real)
     */
    async updateTodayLiveReport() {
        const now = new Date();
        const brDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

        console.log(`[${now.toLocaleTimeString('pt-BR')}] ⚡ Atualizando Dashboard em tempo real (${brDate})...`);

        try {
            const report = await activityAnalyzer.generateReport(brDate, {
                excludeBots: true,
                enrichUserData: true
            });

            const finalReport = {
                ...report,
                date: brDate, // Salva a data real de Brasília (YYYY-MM-DD)
                original_date: brDate,
                is_live: true
            };

            await supabaseService.saveReport(finalReport);
            console.log(`✅ Relatório salvo no Supabase para a data: ${brDate}`);
        } catch (error) {
            console.error('❌ Erro na atualização em tempo real:', error.message);
        }
    }

    async generateDailyReport() {
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Pega a data de ontem no fuso de Brasília
        const yesterday = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        yesterday.setDate(yesterday.getDate() - 1);
        const date = yesterday.toLocaleDateString('en-CA'); // YYYY-MM-DD

        console.log('\n' + '='.repeat(50));
        console.log('[' + time + '] 📊 GERAÇÃO AUTOMÁTICA DE RELATÓRIO');
        console.log('📅 Data: ' + date);
        console.log('='.repeat(50) + '\n');

        try {
            const configPath = path.join(__dirname, '../../.reportconfig.json');
            let config = { excludeUsers: [], excludeBots: true, enrichUserData: true };

            if (fs.existsSync(configPath)) {
                const configContent = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(configContent);
            }

            activityAnalyzer.setExcludedUsers(config.excludeUsers || []);
            const report = await activityAnalyzer.generateReport(date, {
                excludeBots: config.excludeBots !== false,
                enrichUserData: config.enrichUserData !== false
            });

            const jsonPath = path.join(REPORTS_DIR, 'report-' + date + '.json');
            activityAnalyzer.saveReportJSON(report, jsonPath);

            const htmlPath = path.join(REPORTS_DIR, 'report-' + date + '.html');
            activityAnalyzer.saveReportHTML(report, htmlPath);

            // Envia para o Supabase (migmainc.com)
            console.log('[' + time + '] 📤 Enviando para migmainc.com...');

            const finalReport = {
                ...report,
                date: date // Salva a data real de Brasília (YYYY-MM-DD)
            };

            const supabaseResult = await supabaseService.saveReport(finalReport);

            if (supabaseResult.success) {
                console.log('[' + time + '] ✅ Relatório enviado para migmainc.com');
            } else {
                console.log('[' + time + '] ⚠️  Falha ao enviar para migmainc.com: ' + supabaseResult.error);
            }

            console.log('\n✅ Relatório gerado com sucesso!');
            console.log('   📄 JSON: ' + jsonPath);
            console.log('   🌐 HTML: ' + htmlPath + '\n');

            // Inicia limpeza de arquivos antigos
            spawn('node', [path.join(__dirname, '../../scripts/cleanup-logs.js')], { stdio: 'inherit' });

            return { success: true, report, jsonPath, htmlPath, supabaseResult };
        } catch (error) {
            console.error('\n❌ Erro ao gerar relatório automático:', error.message);
            return { success: false, error: error.message };
        }
    }

    startDailySchedule() {
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        cron.schedule('1 0 * * *', async () => {
            await this.generateDailyReport();
        }, {
            timezone: 'America/Sao_Paulo'
        });

        // Atualização em Tempo Real (A cada 5 minutos)
        cron.schedule('*/5 * * * *', async () => {
            await this.updateTodayLiveReport();
        }, {
            timezone: 'America/Sao_Paulo'
        });

        console.log('[' + time + '] 🕐 Agendador de relatórios ativado');
        console.log('[' + time + '] 📅 Relatórios diários às 00:01');
        console.log('[' + time + '] ⚡ Atualização do Dashboard em tempo real (a cada 5 min)');
        console.log('[' + time + '] 📤 Enviados automaticamente para migmainc.com');
    }
}

export default new ReportScheduler();
