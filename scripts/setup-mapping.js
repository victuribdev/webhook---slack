/**
 * Script auxiliar para configurar mapeamentos de usuários
 * 
 * Uso:
 * node scripts/setup-mapping.js U123ABC jibble-user-id-123
 */

const [slackUserId, jibbleUserId] = process.argv.slice(2);

if (!slackUserId || !jibbleUserId) {
  console.error('❌ Uso: node scripts/setup-mapping.js <slackUserId> <jibbleUserId>');
  console.error('Exemplo: node scripts/setup-mapping.js U123ABC jibble-user-id-123');
  process.exit(1);
}

// Simula a criação do mapeamento
// Em produção, você pode usar a API ou editar o arquivo diretamente
console.log('📝 Mapeamento a ser criado:');
console.log(`   Slack User ID: ${slackUserId}`);
console.log(`   Jibble User ID: ${jibbleUserId}`);
console.log('\n💡 Opções para criar o mapeamento:');
console.log('\n1. Via API (recomendado):');
console.log(`   curl -X POST http://localhost:3000/slack/mappings \\`);
console.log(`     -H "Content-Type: application/json" \\`);
console.log(`     -d '{"slackUserId": "${slackUserId}", "jibbleUserId": "${jibbleUserId}"}'`);
console.log('\n2. Editar src/services/userMappingService.js diretamente:');
console.log(`   this.mappings.set('${slackUserId}', '${jibbleUserId}');`);
