import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPPINGS_FILE = path.join(__dirname, '../../data/user-mappings.json');

/**
 * Serviço para mapear usuários do Slack para usuários do Jibble
 * Salva os mapeamentos em um arquivo JSON para persistência
 */
class UserMappingService {
  constructor() {
    // Mapeamento: Slack User ID -> Jibble User ID
    this.mappings = new Map();
    
    // Garante que o diretório existe
    this.ensureDataDirectory();
    
    // Carrega mapeamentos do arquivo
    this.loadMappings();
  }

  /**
   * Garante que o diretório data existe
   */
  ensureDataDirectory() {
    const dataDir = path.dirname(MAPPINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Diretório criado: ${dataDir}`);
    }
  }

  /**
   * Carrega mapeamentos do arquivo JSON
   */
  loadMappings() {
    try {
      if (fs.existsSync(MAPPINGS_FILE)) {
        const data = fs.readFileSync(MAPPINGS_FILE, 'utf8');
        const mappingsArray = JSON.parse(data);
        
        // Converte array de objetos para Map
        this.mappings = new Map();
        if (Array.isArray(mappingsArray)) {
          mappingsArray.forEach(mapping => {
            if (mapping.slackUserId && mapping.jibbleUserId) {
              this.mappings.set(mapping.slackUserId, mapping.jibbleUserId);
            }
          });
        }
        
        console.log(`✅ ${this.mappings.size} mapeamento(s) carregado(s) do arquivo`);
      } else {
        console.log('ℹ️  Arquivo de mapeamentos não encontrado, iniciando vazio');
        // Cria arquivo vazio
        this.saveMappings();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mapeamentos:', error.message);
      console.log('⚠️  Continuando com mapeamentos vazios');
    }
  }

  /**
   * Salva mapeamentos no arquivo JSON
   */
  saveMappings() {
    try {
      const mappingsArray = Array.from(this.mappings.entries()).map(([slack, jibble]) => ({
        slackUserId: slack,
        jibbleUserId: jibble,
      }));
      
      fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappingsArray, null, 2), 'utf8');
      console.log(`💾 Mapeamentos salvos em ${MAPPINGS_FILE}`);
    } catch (error) {
      console.error('❌ Erro ao salvar mapeamentos:', error.message);
    }
  }

  /**
   * Obtém o ID do Jibble para um usuário do Slack
   * @param {string} slackUserId - ID do usuário no Slack
   * @returns {string|null} - ID do usuário no Jibble ou null se não encontrado
   */
  getJibbleUserId(slackUserId) {
    return this.mappings.get(slackUserId) || null;
  }

  /**
   * Define o mapeamento entre Slack e Jibble
   * @param {string} slackUserId - ID do usuário no Slack
   * @param {string} jibbleUserId - ID do usuário no Jibble
   */
  setMapping(slackUserId, jibbleUserId) {
    this.mappings.set(slackUserId, jibbleUserId);
    console.log(`📝 Mapeamento criado: Slack ${slackUserId} -> Jibble ${jibbleUserId}`);
    // Salva automaticamente no arquivo
    this.saveMappings();
  }

  /**
   * Remove um mapeamento
   * @param {string} slackUserId - ID do usuário no Slack
   */
  removeMapping(slackUserId) {
    this.mappings.delete(slackUserId);
    console.log(`🗑️  Mapeamento removido: Slack ${slackUserId}`);
    // Salva automaticamente no arquivo
    this.saveMappings();
  }

  /**
   * Lista todos os mapeamentos
   * @returns {Array} - Array de objetos com mapeamentos
   */
  getAllMappings() {
    return Array.from(this.mappings.entries()).map(([slack, jibble]) => ({
      slackUserId: slack,
      jibbleUserId: jibble,
    }));
  }
}

export default new UserMappingService();
