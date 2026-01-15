import axios from 'axios';
import { config } from '../config/index.js';

/**
 * Serviço para interagir com a API do Slack
 */
class SlackService {
  constructor() {
    this.botToken = config.slack.botToken;
    this.apiUrl = 'https://slack.com/api';
  }

  /**
   * Atualiza o status do perfil de um usuário no Slack
   * @param {string} userId - ID do usuário no Slack
   * @param {string} statusText - Texto do status
   * @param {string} statusEmoji - Emoji do status (ex: 🟢)
   * @returns {Promise<Object>} - Resposta da API
   */
  async updateUserStatus(userId, statusText, statusEmoji = '🟢') {
    try {
      // A API do Slack requer que o emoji esteja vazio ou no formato correto
      const profile = {
        status_text: statusText,
      };

      // Adiciona emoji apenas se fornecido
      if (statusEmoji) {
        profile.status_emoji = statusEmoji;
      }

      const response = await axios.post(
        `${this.apiUrl}/users.profile.set`,
        {
          user: userId,
          profile,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        console.log(`✅ Status atualizado para usuário ${userId}`);
        return { success: true, data: response.data };
      } else {
        console.error('❌ Erro ao atualizar status:', response.data.error);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status no Slack:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Limpa o status do perfil de um usuário
   * @param {string} userId - ID do usuário no Slack
   * @returns {Promise<Object>} - Resposta da API
   */
  async clearUserStatus(userId) {
    return this.updateUserStatus(userId, '', '');
  }

  /**
   * Envia uma mensagem para um canal ou usuário
   * @param {string} channel - ID do canal ou usuário
   * @param {string} text - Texto da mensagem
   * @param {Array} blocks - Blocos opcionais (Block Kit)
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendMessage(channel, text, blocks = null) {
    try {
      const payload = {
        channel,
        text,
      };

      if (blocks) {
        payload.blocks = blocks;
      }

      const response = await axios.post(
        `${this.apiUrl}/chat.postMessage`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Envia uma mensagem efêmera (visível apenas para o usuário)
   * @param {string} channel - ID do canal
   * @param {string} user - ID do usuário que verá a mensagem
   * @param {string} text - Texto da mensagem
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendEphemeralMessage(channel, user, text) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat.postEphemeral`,
        {
          channel,
          user,
          text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        return { success: true, data: response.data };
      } else {
        console.error('❌ Erro ao enviar mensagem efêmera:', response.data.error);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem efêmera:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Obtém informações de um usuário
   * @param {string} userId - ID do usuário no Slack
   * @returns {Promise<Object>} - Informações do usuário
   */
  async getUserInfo(userId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/users.info`,
        {
          params: { user: userId },
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
          },
        }
      );

      if (response.data.ok) {
        return { success: true, data: response.data.user };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('❌ Erro ao obter info do usuário:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Obtém a presença de um usuário
   * @param {string} userId - ID do usuário no Slack
   * @returns {Promise<Object>} - Presença do usuário (active/away)
   */
  async getUserPresence(userId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/users.getPresence`,
        {
          params: { user: userId },
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
          },
        }
      );

      if (response.data.ok) {
        return { success: true, presence: response.data.presence };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('❌ Erro ao obter presença do usuário:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }
}

export default new SlackService();
