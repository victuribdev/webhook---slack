/**
 * Script auxiliar para listar usuários do Jibble e obter seus IDs
 * 
 * Uso: node scripts/get-jibble-users.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JIBBLE_CLIENT_ID = process.env.JIBBLE_CLIENT_ID;
const JIBBLE_CLIENT_SECRET = process.env.JIBBLE_CLIENT_SECRET;
const JIBBLE_IDENTITY_URL = process.env.JIBBLE_IDENTITY_URL || 'https://identity.prod.jibble.io';
const JIBBLE_API_URL = process.env.JIBBLE_API_URL || 'https://api.prod.jibble.io';

async function getAccessToken() {
  try {
    const response = await axios.post(
      `${JIBBLE_IDENTITY_URL}/connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: JIBBLE_CLIENT_ID,
        client_secret: JIBBLE_CLIENT_SECRET,
      }),
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Retorna tanto o token quanto outras informações úteis
    return {
      access_token: response.data.access_token,
      personId: response.data.personId,
      organizationId: response.data.organizationId,
    };
  } catch (error) {
    console.error('❌ Erro ao obter access token:', error.response?.data || error.message);
    throw error;
  }
}

async function getJibbleUsers(accessToken) {
  try {
    // Tenta diferentes endpoints possíveis baseados na documentação do Jibble
    const endpoints = [
      '/api/Members',
      '/api/v1/Members',
      '/api/v1/members',
      '/api/Users',
      '/api/v1/Users',
      '/api/v1/users',
      '/api/People',
      '/api/v1/People',
      '/api/v1/people',
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Tentando endpoint: ${JIBBLE_API_URL}${endpoint}`);
        const response = await axios.get(
          `${JIBBLE_API_URL}${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('\n✅ Sucesso! Resposta recebida:');
        console.log('Status:', response.status);
        console.log('Dados:', JSON.stringify(response.data, null, 2));
        
        // Tenta extrair IDs de diferentes formatos de resposta
        if (Array.isArray(response.data)) {
          console.log('\n📋 Usuários encontrados:');
          response.data.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id || user.personId || user.userId || 'N/A'}, Nome: ${user.name || user.displayName || user.email || 'N/A'}`);
          });
        } else if (response.data.value && Array.isArray(response.data.value)) {
          // Formato OData
          console.log('\n📋 Usuários encontrados (formato OData):');
          response.data.value.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id || user.personId || user.userId || 'N/A'}, Nome: ${user.name || user.displayName || user.email || 'N/A'}`);
          });
        }
        
        return response.data;
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        if (status === 404) {
          console.log(`   ⚠️  Endpoint não encontrado (404)`);
        } else if (status === 401 || status === 403) {
          console.log(`   ⚠️  Sem permissão (${status}):`, data?.error || data?.message || 'Acesso negado');
        } else if (status) {
          console.log(`   ⚠️  Erro ${status}:`, JSON.stringify(data, null, 2));
        } else {
          console.log(`   ⚠️  Erro de conexão:`, error.message);
        }
      }
    }

    console.log('\n❌ Nenhum endpoint funcionou. Vamos tentar obter informações do token...');
    
    // Tenta obter informações do próprio token
    try {
      const tokenInfo = await axios.get(
        `${JIBBLE_IDENTITY_URL}/connect/userinfo`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      console.log('✅ Informações do token:', JSON.stringify(tokenInfo.data, null, 2));
    } catch (e) {
      console.log('⚠️  Não foi possível obter informações do token');
    }

    throw new Error('Nenhum endpoint funcionou. Verifique a documentação da API do Jibble para o endpoint correto.');
  } catch (error) {
    console.error('\n❌ Erro ao obter usuários:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔑 Obtendo access token do Jibble...');
  const tokenResponse = await getAccessToken();
  const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.access_token;
  console.log('✅ Access token obtido\n');

  // Mostra informações do token se disponível
  if (typeof tokenResponse === 'object' && tokenResponse.personId) {
    console.log('📝 Person ID do token:', tokenResponse.personId);
    console.log('📝 Organization ID do token:', tokenResponse.organizationId || 'N/A');
    console.log('');
  }

  console.log('👥 Listando usuários do Jibble...\n');
  await getJibbleUsers(accessToken);
  
  console.log('\n💡 Dica: Se nenhum endpoint funcionou, você pode:');
  console.log('1. Verificar a documentação da API do Jibble');
  console.log('2. Usar o Person ID que veio na resposta do token (se disponível)');
  console.log('3. Verificar no painel do Jibble → Settings → Members');
}

main().catch(console.error);
