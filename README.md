# 🤖 Slack → Jibble Automation

Sistema automatizado que faz clock-in/clock-out no Jibble quando usuários entram/saem de canais do Slack.

## 🎯 Funcionalidades

- ✅ **Automático**: Detecta quando usuários enviam mensagens no Slack
- ✅ **Clock-in automático**: Inicia jornada no Jibble quando você envia uma mensagem
- ✅ **Clock-out automático**: Finaliza jornada no Jibble após 10 minutos sem mensagens
- ✅ **Baseado em mensagens**: Funciona automaticamente quando você envia mensagens (canais, DMs, grupos)
- ✅ **Prevenção de duplicatas**: Evita múltiplos clock-ins/clock-outs duplicados
- ✅ **Status no Slack**: Atualiza status do usuário automaticamente (🟢 Trabalhando)
- ✅ **Seguro**: Validação de assinatura do Slack (HMAC SHA256)
- ✅ **Logs detalhados**: Registra todos os eventos com timestamps
- ✅ **Escalável**: Fácil de estender e manter

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Slack com permissões para criar apps
- Conta no Jibble com acesso à API
- URL pública para webhook (use ngrok para desenvolvimento local)

## 🚀 Instalação

1. **Clone ou baixe o projeto**

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-seu-token-aqui
SLACK_SIGNING_SECRET=seu-signing-secret-aqui
SLACK_CHANNEL_ID=C1234567890

# Jibble API Configuration
JIBBLE_API_KEY=sua-api-key-do-jibble
JIBBLE_API_URL=https://api.jibble.io/v1
JIBBLE_ORG_ID=seu-org-id-se-necessario

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Importante**: 
- `SLACK_CHANNEL_ID`: Não é mais necessário! O sistema agora detecta presença (online/offline)
- `JIBBLE_ORG_ID`: Opcional, será obtido automaticamente do token OAuth

## 🔧 Configuração do Slack

### 1. Criar App no Slack

1. Acesse https://api.slack.com/apps
2. Clique em **"Create New App"** → **"From scratch"**
3. Nome: `Jibble Automation Bot`
4. Selecione seu workspace

### 2. Configurar Permissões (OAuth & Permissions)

Adicione os seguintes **Bot Token Scopes**:

- ✅ `users:read` - Para ler informações de usuários (ESSENCIAL)
- ✅ `users:read.email` - Para ler o email do usuário e mapear automaticamente (ESSENCIAL)
- ✅ `users:read.presence` - Para ler status de presença dos usuários (ESSENCIAL)
- ✅ `users.profile:write` - Para atualizar status dos usuários (ESSENCIAL)
- ✅ `chat:write` - Para enviar mensagens aos usuários (opcional)

### 3. Configurar Event Subscriptions

1. Vá em **Event Subscriptions**
2. Ative **"Enable Events"**
3. Em **"Request URL"**, coloque sua URL pública:
   - **Desenvolvimento local**: Use ngrok (`ngrok http 3000`)
   - **Produção**: Sua URL de produção (ex: `https://seu-dominio.com/slack/events`)
4. Em **"Subscribe to bot events"**, adicione:
   - ✅ `message.channels` - Para detectar mensagens em canais públicos
   - ✅ `message.groups` - Para detectar mensagens em grupos privados
   - ✅ `message.im` - Para detectar mensagens em DMs
   - ✅ `message.mpim` - Para detectar mensagens em grupos de DM
5. Clique em **"Save Changes"**

### 4. Instalar App no Workspace

1. Vá em **"Install App"** ou **"OAuth & Permissions"**
2. Clique em **"Install to Workspace"**
3. Copie o **Bot User OAuth Token** (começa com `xoxb-`)
4. Cole no arquivo `.env` como `SLACK_BOT_TOKEN`

### 5. Obter Signing Secret

1. Vá em **"Basic Information"**
2. Copie o **"Signing Secret"**
3. Cole no arquivo `.env` como `SLACK_SIGNING_SECRET`

### 6. ✅ Pronto!

O sistema agora detecta automaticamente quando você envia mensagens no Slack e faz clock-in/out automático no Jibble!

## 🔑 Configuração da API do Jibble

1. Acesse o painel do Jibble
2. Vá em **Settings** → **API** ou **Integrations**
3. Gere uma API Key
4. Copie a API Key e cole no `.env` como `JIBBLE_API_KEY`
5. Verifique a URL base da API (geralmente `https://api.jibble.io/v1`)

**⚠️ Nota**: Os endpoints da API do Jibble podem variar. Verifique a documentação oficial do Jibble para confirmar os endpoints corretos.

## 👥 Mapeamento de Usuários

Você precisa mapear cada usuário do Slack para seu ID correspondente no Jibble.

### Opção 1: Via API (Recomendado)

```bash
curl -X POST http://localhost:3000/slack/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "slackUserId": "U123ABC",
    "jibbleUserId": "jibble-user-id-123"
  }'
```

### Opção 2: Editar código diretamente

Edite `src/services/userMappingService.js` e adicione os mapeamentos:

```javascript
this.mappings.set('U123ABC', 'jibble-user-id-123');
this.mappings.set('U456DEF', 'jibble-user-id-456');
```

### Como encontrar os IDs?

- **Slack User ID**: Vá no perfil do usuário no Slack → Mais → Copiar ID do membro
- **Jibble User ID**: Consulte a API do Jibble ou painel administrativo

## 🏃 Executando

### Desenvolvimento Local

1. **Inicie o servidor**
```bash
npm run dev
```

2. **Exponha localmente com ngrok** (em outro terminal)
```bash
ngrok http 3000
```

3. **Copie a URL do ngrok** (ex: `https://abc123.ngrok.io`)

4. **Configure no Slack**
   - Vá em **Event Subscriptions** no seu app do Slack
   - Cole a URL: `https://abc123.ngrok.io/slack/events`
   - O Slack vai validar e mostrar ✅

### Produção

1. **Deploy em servidor** (Vercel, Railway, AWS, etc)
2. **Configure a URL pública** no Slack Event Subscriptions
3. **Inicie o servidor**
```bash
npm start
```

## 📡 Endpoints

### `POST /slack/events`
Webhook do Slack (não chame manualmente)
- Recebe eventos do Slack Events API
- Valida assinatura HMAC SHA256
- Processa apenas eventos do canal configurado

### `GET /slack/mappings`
Lista todos os mapeamentos de usuários (Slack → Jibble)

### `POST /slack/mappings`
Cria/atualiza mapeamento de usuário
```json
{
  "slackUserId": "U123ABC",
  "jibbleUserId": "jibble-user-id-123"
}
```

### `GET /slack/stats`
Retorna estatísticas de estado (útil para debug)
```json
{
  "stats": {
    "totalUsers": 5,
    "clockedInUsers": 2,
    "clockedOutUsers": 3
  }
}
```

### `GET /health`
Health check do servidor

## 🔍 Como Funciona

1. **Você envia uma mensagem** no Slack (canal, DM, grupo) → Sistema detecta automaticamente
2. **Clock-In automático** → Se você não estava clockado, faz clock-in no Jibble
3. **Você continua trabalhando** → Envia mais mensagens → Continua clockado
4. **Você para de enviar mensagens** → Após 10 minutos sem mensagens → Clock-out automático
5. **Atualiza status** → Atualiza status no Slack (🟢 Trabalhando / limpa status)

**✨ Exemplo prático:**
- Você entra em um Huddle e envia uma mensagem → Clock-In ✅
- Você continua conversando/enviando mensagens → Continua clockado ✅
- Você sai do Huddle e para de enviar mensagens por 10min → Clock-Out ✅

**⏱️ Timeout de inatividade**: 10 minutos sem mensagens = Clock-Out automático

## 🛠️ Estrutura do Projeto

```
.
├── src/
│   ├── config/          # Configurações
│   ├── handlers/        # Processadores de eventos
│   ├── middleware/      # Middlewares (autenticação)
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços (Slack, Jibble, Mapeamento)
│   ├── utils/           # Utilitários (validação de assinatura)
│   └── server.js        # Servidor principal
├── .env.example         # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

## 🐛 Troubleshooting

### Webhook não está recebendo eventos

- Verifique se a URL está correta no Slack Event Subscriptions
- Confirme que o ngrok está rodando (se em desenvolvimento)
- Verifique os logs do servidor

### Erro de assinatura inválida

- Confirme que `SLACK_SIGNING_SECRET` está correto
- Verifique se o middleware está aplicado corretamente

### Clock-in não funciona

- Verifique se o `JIBBLE_API_KEY` está correto
- Confirme se o endpoint da API do Jibble está correto
- Verifique se o usuário tem mapeamento configurado
- Consulte os logs para ver erros específicos

### Usuário não tem mapeamento

- Adicione o mapeamento via API ou código
- O sistema enviará uma mensagem ao usuário informando que precisa configurar

## 📝 Próximos Passos / Melhorias

- [ ] Adicionar banco de dados para mapeamentos (MongoDB/PostgreSQL)
- [ ] Interface web para gerenciar mapeamentos
- [ ] Suporte a múltiplos canais (configurar quais canais acionam o clock)
- [ ] Histórico de clock-ins/clock-outs
- [ ] Notificações de erro mais detalhadas
- [ ] Suporte a comandos do Slack (`/jibble-status`)
- [ ] Dashboard de estatísticas

## 📄 Licença

MIT

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues e pull requests!
