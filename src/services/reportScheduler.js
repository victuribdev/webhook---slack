import cron from 'node-cron';
import activityAnalyzer from './activityAnalyzer.js';
import supabaseService from './supabaseService.js';
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

    async generateDailyReport() {
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const date = yesterday.toISOString().split('T')[0];

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
            const supabaseResult = await supabaseService.saveReport(report);

            if (supabaseResult.success) {
                console.log('[' + time + '] ✅ Relatório enviado para migmainc.com');
            } else {
                console.log('[' + time + '] ⚠️  Falha ao enviar para migmainc.com: ' + supabaseResult.error);
            }

            console.log('\n✅ Relatório gerado com sucesso!');
            console.log('   📄 JSON: ' + jsonPath);
            console.log('   🌐 HTML: ' + htmlPath + '\n');

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

        console.log('[' + time + '] 🕐 Agendador de relatórios ativado');
        console.log('[' + time + '] 📅 Relatórios serão gerados automaticamente todo dia às 00:01');
        console.log('[' + time + '] 📤 Enviados automaticamente para migmainc.com');
    }
}

export default new ReportScheduler();
