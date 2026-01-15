# 📊 Slack Activity Logger (Sensor Passivo)

Sistema de monitoramento passivo de atividade no Slack. Registra eventos silenciosamente sem interagir com usuários ou sistemas externos.

## 🎯 Filosofia

**"Sensor Passivo"** - O bot funciona como uma caixa-preta que apenas observa e registra eventos, permitindo **inferência posterior** de atividade sem caracterizar controle de jornada ou vínculo empregatício.

### ✅ O que o bot FAZ

- ✅ Registra mensagens enviadas (timestamp, usuário, canal)
- ✅ Registra entradas/saídas de canais
- ✅ Registra mudanças de presença (online/offline)
- ✅ Registra participação em huddles/calls
- ✅ Salva tudo em logs estruturados (JSON)
- ✅ Permite análise posterior por dashboard/admin

### ❌ O que o bot NÃO FAZ

- ❌ Não envia mensagens para usuários
- ❌ Não faz clock-in/clock-out automático
- ❌ Não cobra ou questiona atividade
- ❌ Não define horários ou metas
- ❌ Não atualiza status dos usuários
- ❌ Não interage com APIs externas (Jibble, etc)

## 📋 Eventos Capturados

| Evento | Descrição | Dados Registrados |
|--------|-----------|-------------------|
| `message` | Mensagem enviada | userId, channelId, timestamp, textLength |
| `channel_join` | Entrada em canal | userId, channelId, timestamp |
| `channel_leave` | Saída de canal | userId, channelId, timestamp |
| `presence_change` | Online/Offline | userId, presence (active/away), timestamp |
| `huddle_start` | Início de call/huddle | userId, channelId, timestamp |
| `huddle_end` | Fim de call/huddle | userId, channelId, timestamp |

## 🔧 Configuração do Slack

### Scopes Necessários (Bot Token)

```
✅ users:read              - Ver informações de usuários
✅ users:read.email        - Ver emails (para mapeamento)
✅ users.profile:read      - Ver perfis e presença
✅ channels:read           - Ver canais públicos
✅ channels:history        - Ver histórico de canais públicos
✅ groups:read             - Ver canais privados
✅ groups:history          - Ver histórico de canais privados
✅ im:read                 - Ver DMs
✅ im:history              - Ver histórico de DMs
✅ mpim:read               - Ver group DMs
✅ mpim:history            - Ver histórico de group DMs
✅ calls:read              - Ver informações de calls/huddles
```

### Event Subscriptions

Configure os seguintes eventos no painel do Slack:

```
✅ message.channels        - Mensagens em canais públicos
✅ message.groups          - Mensagens em canais privados
✅ message.im              - Mensagens em DMs
✅ message.mpim            - Mensagens em group DMs
✅ member_joined_channel   - Entrada em canais
✅ member_left_channel     - Saída de canais
✅ presence_change         - Mudanças de presença (se disponível)
```

## 🚀 Instalação

```bash
npm install
```

Configure o `.env`:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-seu-token-aqui
SLACK_SIGNING_SECRET=seu-signing-secret-aqui

# Server Configuration
PORT=3000
NODE_ENV=production
```

## 🏃 Executando

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📡 Endpoints

### `POST /slack/events`
Webhook do Slack (configurado automaticamente)

### `GET /slack/activity-stats`
Retorna estatísticas do dia atual:
```json
{
  "date": "2026-01-14",
  "totalEvents": 1247,
  "uniqueUsers": 15,
  "eventTypes": {
    "message": 892,
    "presence_change": 234,
    "channel_join": 45,
    "huddle_start": 12
  }
}
```

### `GET /health`
Health check do servidor

## 📂 Estrutura de Logs

Os logs são salvos em `data/activity-logs/activity-YYYY-MM-DD.json`:

```json
[
  {
    "timestamp": "2026-01-14T14:23:45.123Z",
    "userId": "U123ABC",
    "eventType": "message",
    "channelId": "C456DEF",
    "hasText": true,
    "textLength": 42
  },
  {
    "timestamp": "2026-01-14T14:25:10.456Z",
    "userId": "U123ABC",
    "eventType": "huddle_start",
    "channelId": "C456DEF"
  }
]
```

## 📊 Análise de Dados

Os logs podem ser analisados posteriormente para:

1. **Inferir períodos de atividade**
   - Agrupar eventos por usuário e data
   - Identificar "sessões" (clusters de eventos próximos)
   - Calcular tempo total de atividade inferida

2. **Gerar relatórios administrativos**
   - Usuários mais ativos
   - Canais com mais movimento
   - Padrões de uso (horários de pico)

3. **Alertas internos (admin-only)**
   - Usuário sem atividade há X dias
   - Canal sem movimento
   - Anomalias de comportamento

## ⚖️ Conformidade Legal

Este sistema foi projetado para **NÃO caracterizar**:
- ❌ Controle de jornada
- ❌ Vínculo empregatício
- ❌ Cobrança de horários
- ❌ Metas de tempo

É apenas um **sensor de eventos** que permite análise posterior, similar a logs de servidor.

## 🔄 Migração do Sistema Anterior

O código do sistema anterior (Clock-In/Out automático com Jibble) foi **comentado** mas não deletado. Para reativar:

1. Descomentar imports em `src/server.js`
2. Descomentar código legado em `src/handlers/eventHandler.js`
3. Reativar `messageTrackingService.start()` no servidor

## 📝 Licença

MIT
