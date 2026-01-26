
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, '../data/activity-logs');
const REPORTS_DIR = path.join(__dirname, '../data/reports');

// Manter apenas os últimos 7 dias de arquivos locais no Render
const MAX_AGE_DAYS = 7;

function cleanupDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    console.log(`🧹 Limpando diretório: ${dirPath}`);
    const files = fs.readdirSync(dirPath);
    const now = Date.now();

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

        if (ageInDays > MAX_AGE_DAYS) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Removido: ${file} (${Math.round(ageInDays)} dias de idade)`);
        }
    });
}

console.log('🚀 Iniciando faxina periódica de arquivos locais...');
cleanupDirectory(LOGS_DIR);
cleanupDirectory(REPORTS_DIR);
console.log('✨ Faxina concluída!');
