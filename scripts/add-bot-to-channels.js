/**
 * Script para adicionar o bot a todos os canais públicos
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

async function addBotToChannels() {
  try {
    // Lista todos os canais públicos
    const channelsResponse = await axios.get(
      'https://slack.com/api/conversations.list',
      {
        params: {
          types: 'public_channel,private_channel',
          exclude_archived: true,
        },
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        },
      }
    );

    if (!channelsResponse.data.ok) {
      console.error('❌ Erro ao listar canais:', channelsResponse.data.error);
      return;
    }

    const channels = channelsResponse.data.channels;
    console.log(`📋 Encontrados ${channels.length} canais`);

    // Adiciona o bot a cada canal
    for (const channel of channels) {
      try {
        const inviteResponse = await axios.post(
          'https://slack.com/api/conversations.invite',
          {
            channel: channel.id,
            users: await getBotUserId(),
          },
          {
            headers: {
              'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (inviteResponse.data.ok) {
          console.log(`✅ Bot adicionado ao canal: #${channel.name}`);
        } else {
          if (inviteResponse.data.error === 'already_in_channel') {
            console.log(`ℹ️  Bot já está no canal: #${channel.name}`);
          } else {
            console.log(`⚠️  Erro ao adicionar ao canal #${channel.name}:`, inviteResponse.data.error);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao adicionar bot ao canal #${channel.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function getBotUserId() {
  const response = await axios.get(
    'https://slack.com/api/auth.test',
    {
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      },
    }
  );

  if (response.data.ok) {
    return response.data.user_id;
  }
  throw new Error('Não foi possível obter o ID do bot');
}

addBotToChannels();
