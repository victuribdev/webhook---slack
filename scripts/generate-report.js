#!/usr/bin/env node

import activityAnalyzer from '../src/services/activityAnalyzer.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script CLI para gerar relatórios de atividade
 * 
 * Uso:
 *   node scripts/generate-report.js                    # Gera relatório de hoje
 *   node scripts/generate-report.js 2026-01-14         # Gera relatório de data específica
 *   node scripts/generate-report.js --list             # Lista arquivos de log disponíveis
 */

function printUsage() {
    console.log(`
📊 Gerador de Relatórios de Atividade

Uso:
  node scripts/generate-report.js                    # Relatório de hoje
  node scripts/generate-report.js 2026-01-14         # Relatório de data específica
  node scripts/generate-report.js --list             # Lista logs disponíveis

Exemplos:
  node scripts/generate-report.js
  node scripts/generate-report.js 2026-01-14
  node scripts/generate-report.js --list
  
Configuração:
  Edite .reportconfig.json para excluir usuários específicos
  `);
}

async function main() {
    const args = process.argv.slice(2);

    // Lista arquivos de log
    if (args.includes('--list') || args.includes('-l')) {
        console.log('\n📁 Arquivos de log disponíveis:\n');
        const files = activityAnalyzer.listLogFiles();

        if (files.length === 0) {
            console.log('   ⚠️  Nenhum arquivo de log encontrado.');
            console.log('   💡 Certifique-se de que o bot está rodando e capturando eventos.\n');
            return;
        }

        files.forEach((file, idx) => {
            const date = file.replace('activity-', '').replace('.json', '');
            console.log(`   ${idx + 1}. ${date} (${file})`);
        });
        console.log('');
        return;
    }

    // Ajuda
    if (args.includes('--help') || args.includes('-h')) {
        printUsage();
        return;
    }

    // Determina a data
    let date;
    if (args.length > 0 && !args[0].startsWith('-')) {
        date = args[0];
    } else {
        // Usa data de hoje
        date = new Date().toISOString().split('T')[0];
    }

    console.log(`\n📊 Gerando relatório para: ${date}\n`);

    // Carrega configuração se existir
    const configPath = path.join(__dirname, '../.reportconfig.json');
    let config = {
        excludeUsers: [],
        excludeBots: true,
        enrichUserData: true
    };

    if (fs.existsSync(configPath)) {
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            config = { ...config, ...JSON.parse(configContent) };

            if (config.excludeUsers.length > 0) {
                console.log(`🔧 Configuração carregada: Excluindo ${config.excludeUsers.length} usuário(s)\n`);
            }
        } catch (error) {
            console.warn('⚠️  Erro ao carregar .reportconfig.json, usando configuração padrão\n');
        }
    }

    // Define usuários excluídos
    if (config.excludeUsers && config.excludeUsers.length > 0) {
        activityAnalyzer.setExcludedUsers(config.excludeUsers);
    }

    // Gera análise (agora é async)
    const report = await activityAnalyzer.generateReport(date, {
        excludeBots: config.excludeBots,
        enrichUserData: config.enrichUserData
    });

    if (report.totalEvents === 0) {
        console.log(`⚠️  Nenhum evento encontrado para ${date}`);
        console.log(`💡 Verifique se o arquivo existe: data/activity-logs/activity-${date}.json\n`);
        return;
    }

    // Cria diretório de relatórios se não existir
    const reportsDir = path.join(__dirname, '../data/reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Salva relatórios
    const jsonPath = path.join(reportsDir, `report-${date}.json`);
    const htmlPath = path.join(reportsDir, `report-${date}.html`);

    activityAnalyzer.saveReportJSON(report, jsonPath);
    activityAnalyzer.saveReportHTML(report, htmlPath);

    // Exibe resumo
    console.log(`\n📈 Resumo do Relatório:\n`);
    console.log(`   📅 Data: ${date}`);
    console.log(`   📊 Total de Eventos: ${report.totalEvents}`);
    console.log(`   👥 Usuários Ativos: ${report.uniqueUsers}`);
    console.log(`   🔄 Sessões Totais: ${report.users.reduce((sum, u) => sum + u.totalSessions, 0)}`);
    console.log('');

    console.log(`📊 Top 5 Usuários Mais Ativos:\n`);
    report.users.slice(0, 5).forEach((user, idx) => {
        const displayName = user.userName || user.userId;
        const emailInfo = user.userEmail ? ` (${user.userEmail})` : '';

        console.log(`   ${idx + 1}. ${displayName}${emailInfo}`);
        console.log(`      ⏱️  Tempo Ativo: ${user.totalActiveTimeFormatted}`);
        console.log(`      📨 Eventos: ${user.totalEvents}`);
        console.log(`      🔄 Sessões: ${user.totalSessions}`);
        console.log('');
    });

    console.log(`✅ Relatórios gerados com sucesso!\n`);
    console.log(`   📄 JSON: ${jsonPath}`);
    console.log(`   🌐 HTML: ${htmlPath}`);
    console.log(`\n💡 Abra o arquivo HTML no navegador para visualizar o relatório completo.\n`);
}

main();
