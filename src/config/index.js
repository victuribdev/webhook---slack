import dotenv from 'dotenv';

dotenv.config();

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    channelId: process.env.SLACK_CHANNEL_ID, // Canal específico para monitorar
  },
  jibble: {
    clientId: process.env.JIBBLE_CLIENT_ID,
    clientSecret: process.env.JIBBLE_CLIENT_SECRET,
    apiUrl: process.env.JIBBLE_API_URL || 'https://workspace.prod.jibble.io',
    timeTrackingUrl: process.env.JIBBLE_TIME_TRACKING_URL || 'https://time-tracking.prod.jibble.io',
    identityUrl: process.env.JIBBLE_IDENTITY_URL || 'https://identity.prod.jibble.io',
    orgId: process.env.JIBBLE_ORG_ID, // Organization ID (vem no token response)
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

// Validação de variáveis obrigatórias
const requiredEnvVars = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'JIBBLE_CLIENT_ID',
  'JIBBLE_CLIENT_SECRET',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`⚠️  AVISO: ${varName} não está definido no .env`);
  }
});
