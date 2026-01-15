/**
 * Script para testar endpoints de Kiosk que podem ter ações de ClockIn/ClockOut
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

async function testEndpoint(method, url, data = null, description) {
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

    console.log(`\n🔍 ${description}`);
    console.log(`   ${method} ${url}`);
    
    const response = await axios(config);
    console.log(`   ✅ Sucesso! Status: ${response.status}`);
    if (response.data) {
      const dataStr = JSON.stringify(response.data, null, 2);
      console.log(`   📦 Resposta:`, dataStr.substring(0, 500));
    }
    return { success: true, data: response.data };
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    if (status === 404) {
      console.log(`   ⚠️  Endpoint não encontrado (404)`);
    } else if (status === 405) {
      console.log(`   ⚠️  Método não permitido (405)`);
    } else if (status) {
      console.log(`   ❌ Erro ${status}`);
      if (data) {
        const errorStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        console.log(`   📝 Detalhes:`, errorStr.substring(0, 300));
      }
    } else {
      console.log(`   ❌ Erro de conexão:`, error.message);
    }
    return { success: false, status, error: data };
  }
}

async function main() {
  console.log('🔍 Testando endpoints de Kiosk e Clock do Jibble...\n');

  // Lista de endpoints para testar baseados em APIs comuns de time tracking
  const endpoints = [
    // Tentar via Kiosk API (muitas APIs usam Kiosk para clock)
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/Kiosks/ClockIn`,
      data: { personId: JIBBLE_PERSON_ID },
      description: 'ClockIn via Kiosks'
    },
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/Kiosks/ClockOut`,
      data: { personId: JIBBLE_PERSON_ID },
      description: 'ClockOut via Kiosks'
    },
    
    // Tentar como ação bound ao Person
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})/Jibble.Workspace.Model.ClockIn`,
      data: {},
      description: 'ClockIn como ação bound'
    },
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})/Jibble.Workspace.Model.ClockOut`,
      data: {},
      description: 'ClockOut como ação bound'
    },
    
    // Tentar via Action Import
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/ClockIn`,
      data: { personId: JIBBLE_PERSON_ID },
      description: 'ClockIn via Action Import'
    },
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/ClockOut`,
      data: { personId: JIBBLE_PERSON_ID },
      description: 'ClockOut via Action Import'
    },
    
    // Tentar criar TimeEntry e depois parar
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/People(${JIBBLE_PERSON_ID})/TimeEntries`,
      data: { 
        startTime: new Date().toISOString(),
        note: 'Started from Slack'
      },
      description: 'Criar TimeEntry vinculado ao Person'
    },
    
    // Tentar via endpoint de Time Tracking
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/TimeTracking/Start`,
      data: { personId: JIBBLE_PERSON_ID },
      description: 'Start via TimeTracking'
    },
    {
      method: 'POST',
      url: `${JIBBLE_API_URL}/v1/TimeTracking/Stop`,
      data: { personId: JIBBLE_PERSON_ID },
      description: 'Stop via TimeTracking'
    },
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(
      endpoint.method,
      endpoint.url,
      endpoint.data,
      endpoint.description
    );
    // Delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n💡 Se nenhum funcionou, verifique a documentação do Jibble:');
  console.log('   - Procure por "Time Tracking API"');
  console.log('   - Procure por "Clock In" ou "Clock Out"');
  console.log('   - Verifique se há uma API separada de Kiosk');
  console.log('   - Verifique exemplos de código na documentação');
}

main().catch(console.error);
