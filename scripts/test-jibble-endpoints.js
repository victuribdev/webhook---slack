/**
 * Script para testar diferentes endpoints da API do Jibble
 * e descobrir qual é o correto para clock-in/clock-out
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JIBBLE_CLIENT_ID = process.env.JIBBLE_CLIENT_ID;
const JIBBLE_CLIENT_SECRET = process.env.JIBBLE_CLIENT_SECRET;
const JIBBLE_IDENTITY_URL = process.env.JIBBLE_IDENTITY_URL || 'https://identity.prod.jibble.io';
const JIBBLE_API_URL = process.env.JIBBLE_API_URL || 'https://workspace.prod.jibble.io';
const JIBBLE_PERSON_ID = '218a5a0f-395d-451a-929d-6098b57b5711';

async function getAccessToken() {
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
  return response.data.access_token;
}

async function testEndpoint(method, url, data = null) {
  try {
    const accessToken = await getAccessToken();
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message,
    };
  }
}

async function main() {
  console.log('🔍 Testando endpoints da API do Jibble...\n');

  const accessToken = await getAccessToken();
  console.log('✅ Access token obtido\n');

  // Lista de endpoints para testar
  const endpoints = [
    // Tentar GET primeiro para ver o que existe
    { method: 'GET', url: `${JIBBLE_API_URL}/v1/TimeEntries`, description: 'Listar TimeEntries' },
    { method: 'GET', url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})/TimeEntries`, description: 'TimeEntries do usuário' },
    { method: 'GET', url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})`, description: 'Info do usuário' },
    
    // Tentar descobrir ações disponíveis
    { method: 'GET', url: `${JIBBLE_API_URL}/v1/$metadata`, description: 'Metadata OData' },
    { method: 'OPTIONS', url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})`, description: 'Ver métodos permitidos' },
    
    // Tentar POST com diferentes formatos
    { 
      method: 'POST', 
      url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})/Default.ClockIn`, 
      data: {},
      description: 'ClockIn via Default' 
    },
    { 
      method: 'POST', 
      url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})/ClockIn`, 
      data: {},
      description: 'ClockIn direto' 
    },
    { 
      method: 'POST', 
      url: `${JIBBLE_API_URL}/v1/TimeEntries`, 
      data: { personId: JIBBLE_PERSON_ID },
      description: 'Criar TimeEntry' 
    },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testando: ${endpoint.method} ${endpoint.url}`);
    console.log(`   Descrição: ${endpoint.description}`);
    
    const result = await testEndpoint(endpoint.method, endpoint.url, endpoint.data);
    
    if (result.success) {
      console.log(`   ✅ Sucesso! Status: ${result.status}`);
      if (result.data) {
        console.log(`   📦 Resposta:`, JSON.stringify(result.data, null, 2).substring(0, 500));
      }
    } else {
      console.log(`   ❌ Erro ${result.status || 'N/A'}`);
      if (result.error) {
        const errorStr = typeof result.error === 'string' 
          ? result.error 
          : JSON.stringify(result.error, null, 2);
        console.log(`   📝 Detalhes:`, errorStr.substring(0, 300));
      }
    }
    
    // Pequeno delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n💡 Dica: Verifique a documentação do Jibble na seção "Time Tracking"');
  console.log('   Procure por endpoints como:');
  console.log('   - ClockIn');
  console.log('   - ClockOut');
  console.log('   - TimeEntries');
  console.log('   - StartTimeEntry');
  console.log('   - StopTimeEntry');
}

main().catch(console.error);
