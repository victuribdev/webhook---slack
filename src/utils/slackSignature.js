import crypto from 'crypto';

/**
 * Valida a assinatura do Slack para garantir que a requisição é legítima
 * @param {string} signingSecret - Secret do Slack
 * @param {string} timestamp - Timestamp da requisição
 * @param {string} body - Corpo da requisição (string)
 * @param {string} signature - Assinatura recebida
 * @returns {boolean} - true se válido, false caso contrário
 */
export function verifySlackSignature(signingSecret, timestamp, body, signature) {
  // Verifica se o timestamp não é muito antigo (prevenção de replay attacks)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    console.warn('⚠️  Timestamp muito antigo, possível replay attack');
    return false;
  }

  // Cria a assinatura esperada
  const sigBaseString = `v0:${timestamp}:${body}`;
  const expectedSignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBaseString)
    .digest('hex');

  // Compara usando timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
