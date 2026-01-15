import axios from 'axios';
import { randomUUID } from 'crypto';
import { config } from '../config/index.js';

/**
 * Serviço para interagir com a API do Jibble
 * Usa OAuth 2.0 Client Credentials flow
 */
class JibbleService {
  constructor() {
    this.apiUrl = config.jibble.apiUrl;
    this.timeTrackingUrl = config.jibble.timeTrackingUrl;
    this.identityUrl = config.jibble.identityUrl;
    this.clientId = config.jibble.clientId;
    this.clientSecret = config.jibble.clientSecret;
    this.orgId = config.jibble.orgId;
    
    // Cache do access token
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Calcula o offset de timezone no formato ISO 8601 (ex: "-PT3H" para UTC-3)
   * @returns {string} - Offset no formato ISO 8601
   */
  getTimezoneOffset() {
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(offsetMinutes / 60);
    const sign = offsetMinutes > 0 ? '-' : '+';
    return `${sign}PT${offsetHours}H`;
  }

  /**
   * Gera o objeto platform no formato esperado pelo Jibble
   * @returns {Object} - Objeto platform
   */
  getPlatformInfo() {
    // Detecta o OS baseado em process.platform
    let os = 'Unknown';
    if (process.platform === 'win32') os = 'Windows';
    else if (process.platform === 'darwin') os = 'macOS';
    else if (process.platform === 'linux') os = 'Linux';

    return {
      deviceName: 'Slack Integration',
      deviceModel: null,
      clientVersion: '1.0.0',
      os: os,
    };
  }

  /**
   * Obtém um access token usando OAuth 2.0 Client Credentials
   * @returns {Promise<string>} - Access token
   */
  async getAccessToken() {
    // Se temos um token válido em cache, retorna ele
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.identityUrl}/connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      
      // Calcula quando o token expira (usa expires_in em segundos)
      // Subtrai 60 segundos para renovar antes de expirar
      const expiresIn = response.data.expires_in || 2147483647;
      this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

      // Salva orgId se vier na resposta
      if (response.data.organizationId && !this.orgId) {
        this.orgId = response.data.organizationId;
        console.log(`📝 Organization ID obtido: ${this.orgId}`);
      }

      console.log('✅ Access token obtido do Jibble');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Erro ao obter access token do Jibble:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Faz clock-in no Jibble para um usuário
   * @param {string} jibbleUserId - ID do usuário no Jibble (personId)
   * @param {string} note - Nota opcional para o registro
   * @returns {Promise<Object>} - Resposta da API
   */
  async clockIn(jibbleUserId, note = 'Started automatically from Slack') {
    try {
      // Obtém access token
      const accessToken = await this.getAccessToken();

      // Formato correto baseado na requisição real do Jibble que descobrimos
      const payload = {
        type: 'In',
        personId: jibbleUserId,
        clientType: 'Web',
        offset: this.getTimezoneOffset(),
        platform: this.getPlatformInfo(),
        id: randomUUID(),
      };

      // Adiciona note se fornecido
      if (note) {
        payload.note = note;
      }

      console.log(`🕐 Fazendo clock-in para usuário ${jibbleUserId}...`);

      const response = await axios.post(
        `${this.timeTrackingUrl}/v1/TimeEntries`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'odata-version': '4.0',
          },
        }
      );

      console.log(`✅ Clock-in realizado com sucesso para usuário ${jibbleUserId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error(`❌ Erro ao fazer clock-in no Jibble:`, status ? `HTTP ${status}` : error.message);
      if (data) {
        console.error('   Detalhes:', JSON.stringify(data, null, 2));
      }
      
      return {
        success: false,
        error: data || error.message,
        status: status,
      };
    }
  }


  /**
   * Faz clock-out no Jibble para um usuário
   * @param {string} jibbleUserId - ID do usuário no Jibble (personId)
   * @param {string} note - Nota opcional para o registro
   * @returns {Promise<Object>} - Resposta da API
   */
  async clockOut(jibbleUserId, note = 'Stopped automatically from Slack') {
    try {
      // Obtém access token
      const accessToken = await this.getAccessToken();

      // Formato correto baseado na requisição real do Jibble que descobrimos
      // Para clock-out, mudamos apenas o type para "Out"
      const payload = {
        type: 'Out',
        personId: jibbleUserId,
        clientType: 'Web',
        offset: this.getTimezoneOffset(),
        platform: this.getPlatformInfo(),
        id: randomUUID(),
      };

      // Adiciona note se fornecido
      if (note) {
        payload.note = note;
      }

      console.log(`🕐 Fazendo clock-out para usuário ${jibbleUserId}...`);

      const response = await axios.post(
        `${this.timeTrackingUrl}/v1/TimeEntries`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'odata-version': '4.0',
          },
        }
      );

      console.log(`✅ Clock-out realizado com sucesso para usuário ${jibbleUserId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error(`❌ Erro ao fazer clock-out no Jibble:`, status ? `HTTP ${status}` : error.message);
      if (data) {
        console.error('   Detalhes:', JSON.stringify(data, null, 2));
      }
      
      return {
        success: false,
        error: data || error.message,
        status: status,
      };
    }
  }

  /**
   * Lista todos os usuários (People) da organização no Jibble
   * @returns {Promise<Array>} - Array de usuários com id, email, name, etc
   */
  async getAllPeople() {
    try {
      const accessToken = await this.getAccessToken();
      
      // Tenta diferentes endpoints possíveis baseados na documentação OData do Jibble
      const endpoints = [
        `${this.apiUrl}/v1/People`,
        `${this.apiUrl}/v1/people`,
        `${this.apiUrl}/People`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'odata-version': '4.0',
            },
            params: {
              '$expand': 'position',
            },
          });

          // OData geralmente retorna { value: [...] }
          if (response.data.value && Array.isArray(response.data.value)) {
            console.log(`✅ ${response.data.value.length} usuário(s) encontrado(s) no Jibble`);
            return response.data.value;
          }
          
          // Ou pode retornar array direto
          if (Array.isArray(response.data)) {
            console.log(`✅ ${response.data.length} usuário(s) encontrado(s) no Jibble`);
            return response.data;
          }

          return [];
        } catch (error) {
          const status = error.response?.status;
          if (status === 404) {
            // Tenta próximo endpoint
            continue;
          }
          throw error;
        }
      }

      console.warn('⚠️  Nenhum endpoint de People funcionou');
      return [];
    } catch (error) {
      console.error('❌ Erro ao listar usuários do Jibble:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Busca um usuário do Jibble pelo email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} - Usuário encontrado ou null
   */
  async findUserByEmail(email) {
    try {
      const allPeople = await this.getAllPeople();
      
      // Busca por email (case-insensitive)
      const user = allPeople.find(
        person => person.email && person.email.toLowerCase() === email.toLowerCase()
      );

      if (user) {
        console.log(`✅ Usuário Jibble encontrado por email: ${email} -> ${user.id || user.personId}`);
        return user;
      }

      console.log(`⚠️  Usuário Jibble não encontrado para email: ${email}`);
      return null;
    } catch (error) {
      console.error(`❌ Erro ao buscar usuário por email ${email}:`, error.message);
      return null;
    }
  }
}

export default new JibbleService();
