/**
 * Script para parsear o metadata OData do Jibble e encontrar ações de ClockIn/ClockOut
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

dotenv.config();

const JIBBLE_CLIENT_ID = process.env.JIBBLE_CLIENT_ID;
const JIBBLE_CLIENT_SECRET = process.env.JIBBLE_CLIENT_SECRET;
const JIBBLE_IDENTITY_URL = process.env.JIBBLE_IDENTITY_URL || 'https://identity.prod.jibble.io';
const JIBBLE_API_URL = process.env.JIBBLE_API_URL || 'https://workspace.prod.jibble.io';

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

async function getMetadata() {
  const accessToken = await getAccessToken();
  const response = await axios.get(
    `${JIBBLE_API_URL}/v1/$metadata`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/xml',
      },
    }
  );
  return response.data;
}

async function parseMetadata(xmlString) {
  const result = await parseXML(xmlString, {
    explicitArray: false,
    mergeAttrs: true,
    explicitRoot: false,
  });
  return result;
}

async function findClockActions(metadata) {
  console.log('\n🔍 Procurando ações de ClockIn/ClockOut no metadata...\n');
  
  // Procura por Actions e Functions relacionadas a Clock ou Time
  const actions = [];
  
  function searchInObject(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) return;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Procura por Action ou Function
      if (key === 'Action' || key === 'Function') {
        if (Array.isArray(value)) {
          value.forEach(action => {
            const name = action['@_Name'] || action.Name;
            if (name && (name.toLowerCase().includes('clock') || name.toLowerCase().includes('time'))) {
              actions.push({
                type: key,
                name: name,
                path: currentPath,
                details: action,
              });
            }
          });
        } else if (value['@_Name'] || value.Name) {
          const name = value['@_Name'] || value.Name;
          if (name.toLowerCase().includes('clock') || name.toLowerCase().includes('time')) {
            actions.push({
              type: key,
              name: name,
              path: currentPath,
              details: value,
            });
          }
        }
      }
      
      // Continua procurando recursivamente
      if (typeof value === 'object') {
        searchInObject(value, currentPath);
      }
    }
  }
  
  searchInObject(metadata);
  
  return actions;
}

async function main() {
  try {
    console.log('📥 Obtendo metadata OData do Jibble...');
    const xmlMetadata = await getMetadata();
    
    console.log('🔍 Parseando XML...');
    const metadata = await parseMetadata(xmlMetadata);
    
    console.log('✅ Metadata parseado com sucesso!\n');
    
    // Procura por ações relacionadas a Clock
    const clockActions = await findClockActions(metadata);
    
    if (clockActions.length > 0) {
      console.log(`\n✅ Encontradas ${clockActions.length} ação(ões) relacionada(s) a Clock/Time:\n`);
      clockActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action.type}: ${action.name}`);
        console.log(`   Caminho: ${action.path}`);
        if (action.details.Parameter) {
          console.log(`   Parâmetros:`, JSON.stringify(action.details.Parameter, null, 2));
        }
        console.log('');
      });
    } else {
      console.log('\n⚠️  Nenhuma ação de Clock encontrada no metadata.');
      console.log('\n📋 Vamos procurar por EntityTypes relacionados a Time...\n');
      
      // Procura por EntityTypes
      const entityTypes = [];
      function findEntityTypes(obj, path = '') {
        if (typeof obj !== 'object' || obj === null) return;
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'EntityType') {
            const arr = Array.isArray(value) ? value : [value];
            arr.forEach(et => {
              const name = et['@_Name'] || et.Name;
              if (name && (name.toLowerCase().includes('time') || name.toLowerCase().includes('entry'))) {
                entityTypes.push({
                  name: name,
                  properties: et.Property || [],
                  navigationProperties: et.NavigationProperty || [],
                });
              }
            });
          }
          if (typeof value === 'object') {
            findEntityTypes(value, path);
          }
        }
      }
      findEntityTypes(metadata);
      
      if (entityTypes.length > 0) {
        console.log('📋 EntityTypes encontrados:');
        entityTypes.forEach(et => {
          console.log(`\n- ${et.name}`);
          if (et.properties.length > 0) {
            console.log('  Propriedades:', et.properties.map(p => p['@_Name'] || p.Name).join(', '));
          }
        });
      }
    }
    
    // Salva o metadata completo em um arquivo para análise manual
    const fs = await import('fs');
    fs.writeFileSync('metadata-output.json', JSON.stringify(metadata, null, 2));
    console.log('\n💾 Metadata completo salvo em: metadata-output.json');
    console.log('   Você pode analisar manualmente este arquivo para encontrar os endpoints corretos.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

main().catch(console.error);
