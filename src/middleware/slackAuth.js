import { verifySlackSignature } from '../utils/slackSignature.js';
import { config } from '../config/index.js';

/**
 * Middleware para validar requisições do Slack
 * Converte o body (Buffer) para string e faz o parse para JSON
 */
export function slackAuthMiddleware(req, res, next) {
  console.log(`🔐 [${new Date().toISOString()}] Middleware de autenticação executado`);
  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];

  if (!signature || !timestamp) {
    console.warn('⚠️  Requisição sem assinatura do Slack');
    console.warn('   Headers recebidos:', Object.keys(req.headers));
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // O body precisa ser uma string para validação
  // Quando vem do express.raw(), é um Buffer, então convertemos para string
  const rawBody = Buffer.isBuffer(req.body) 
    ? req.body.toString('utf8')
    : typeof req.body === 'string' 
    ? req.body 
    : JSON.stringify(req.body);

  const isValid = verifySlackSignature(
    config.slack.signingSecret,
    timestamp,
    rawBody,
    signature
  );

  if (!isValid) {
    console.warn('⚠️  Assinatura inválida do Slack');
    console.warn('   📝 Signature recebida:', signature);
    console.warn('   📝 Timestamp recebido:', timestamp);
    console.warn('   📝 Body (primeiros 200 chars):', rawBody.substring(0, 200));
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  console.log('✅ Assinatura válida do Slack');

  // Faz o parse do body e armazena no req.body para uso nas rotas
  try {
    req.body = JSON.parse(rawBody);
  } catch (error) {
    console.error('❌ Erro ao fazer parse do body:', error);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  next();
}
