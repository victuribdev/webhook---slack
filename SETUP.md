# 🚀 Guia de Configuração Completo

Este guia detalha passo a passo como configurar o sistema de automação Slack → Jibble.

## 📋 Checklist de Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] Conta no Slack com permissões de administrador
- [ ] Conta no Jibble com acesso à API
- [ ] ngrok instalado (para desenvolvimento local) ou servidor público (para produção)

## 🔧 Passo 1: Configurar App no Slack

### 1.1 Criar o App

1. Acesse https://api.slack.com/apps
2. Clique em **"Create New App"** ou **"Criar novo aplicativo"**
3. **IMPORTANTE**: Escolha **"Do zero" (From scratch)** 
   - ⚠️ NÃO escolha "De um manifesto" (From a manifest)
   - A opção "Do zero" permite configurar manualmente tudo que precisamos
4. Preencha:
   - **App Name** / **Nome do App**: `Jibble Automation Bot`
   - **Pick a workspace** / **Escolher workspace**: Selecione seu workspace
5. Clique em **"Create App"** ou **"Criar aplicativo"**

### 1.2 Configurar Permissões (OAuth & Permissions)

1. No menu lateral, vá em **"OAuth & Permissions"**
2. Role até **"Scopes"** → **"Bot Token Scopes"**
3. Clique em **"Add an OAuth Scope"** e adicione **APENAS**:
   - ✅ `chat:write` - Para enviar mensagens aos usuários (ESSENCIAL)
   - ✅ `users:read` - Para ler informações de usuários (ESSENCIAL)
   - ✅ `users:read.email` - Para ler o email do usuário e mapear automaticamente (ESSENCIAL)
   - ✅ `users.profile:write` - Para atualizar status dos usuários (ESSENCIAL)
   - ✅ `channels:read` - Para ler informações de canais (opcional mas recomendado)
   - ⚠️ **NÃO adicione** `channels:join` ou `channels:write` - não são necessários!
4. Clique em **"Save Changes"** após adicionar os escopos

### 1.3 Instalar App no Workspace

1. Ainda em **"OAuth & Permissions"**, role até o topo
2. Clique em **"Install to Workspace"**
3. Revise as permissões e clique em **"Allow"**
4. **IMPORTANTE**: Copie o **"Bot User OAuth Token"** (começa com `xoxb-`)
   - Este será seu `SLACK_BOT_TOKEN`

### 1.4 Obter Signing Secret

1. No menu lateral, vá em **"Basic Information"**
2. Role até **"App Credentials"**
3. Copie o **"Signing Secret"**
   - Este será seu `SLACK_SIGNING_SECRET`

### 1.5 Configurar Event Subscriptions

1. No menu lateral, vá em **"Event Subscriptions"**
2. Ative o toggle **"Enable Events"**
3. Em **"Request URL"**, você precisará colocar sua URL pública:
   - **Desenvolvimento**: Use ngrok (veja Passo 3)
   - **Produção**: Sua URL de produção (ex: `https://seu-dominio.com/slack/events`)
4. Em **"Subscribe to bot events"**, clique em **"Add Bot User Event"** e adicione:
   - `member_joined_channel`
   - `member_left_channel`
5. Clique em **"Save Changes"**

### 1.6 Obter Channel ID

Você precisa do ID do canal que será monitorado (ex: `#em-trabalho`):

**Método 1 - Via Interface do Slack:**
1. No Slack, clique com botão direito no canal
2. Selecione **"View channel details"** ou **"Ver detalhes do canal"**
3. Role até o final da página
4. Copie o **"Channel ID"** (começa com `C`)
   - Este será seu `SLACK_CHANNEL_ID`

**Método 2 - Via URL:**
1. Abra o canal no navegador
2. A URL será algo como: `https://workspace.slack.com/archives/C1234567890`
3. O `C1234567890` é o Channel ID

**Método 3 - Via API (se o bot já estiver instalado):**
```bash
curl -H "Authorization: Bearer xoxb-seu-token" \
  https://slack.com/api/conversations.list
```

## 🔑 Passo 2: Configurar API do Jibble

### 2.1 Obter API Key

1. Acesse o painel administrativo do Jibble
2. Vá em **Settings** → **API** ou **Integrations**
3. Gere uma nova API Key
4. Copie a API Key
   - Este será seu `JIBBLE_API_KEY`

### 2.2 Verificar Endpoints da API

Consulte a documentação oficial do Jibble para confirmar:
- URL base da API (geralmente `https://api.jibble.io/v1`)
- Endpoints de clock-in/clock-out
- Se é necessário `org_id` ou `organization_id`

**Endpoints típicos:**
- Clock-in: `POST /v1/time_entries`
- Clock-out: `POST /v1/time_entries/stop`

### 2.3 Obter Organization ID (se necessário)

Algumas APIs do Jibble exigem `org_id`:
1. Verifique na documentação da API
2. Pode estar disponível no painel administrativo
3. Ou pode ser obtido via API: `GET /v1/organizations`

## 💻 Passo 3: Configurar Ambiente Local

### 3.1 Instalar Dependências

```bash
npm install
```

### 3.2 Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp env.example.txt .env
```

2. Edite o arquivo `.env` com suas credenciais:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-seu-token-aqui
SLACK_SIGNING_SECRET=seu-signing-secret-aqui
SLACK_CHANNEL_ID=C1234567890

# Jibble API Configuration
JIBBLE_API_KEY=sua-api-key-aqui
JIBBLE_API_URL=https://api.jibble.io/v1
JIBBLE_ORG_ID=seu-org-id-se-necessario

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3.3 Instalar e Configurar ngrok (Desenvolvimento)

1. Instale o ngrok: https://ngrok.com/download
2. Em um terminal separado, execute:
```bash
ngrok http 3000
```
3. Copie a URL HTTPS (ex: `https://abc123.ngrok.io`)
4. Volte ao Slack → **Event Subscriptions** → **Request URL**
5. Cole: `https://abc123.ngrok.io/slack/events`
6. O Slack vai validar e mostrar ✅

**⚠️ Importante**: A URL do ngrok muda a cada vez que você reinicia (no plano gratuito). Para desenvolvimento, você precisará atualizar no Slack sempre que reiniciar.

## 👥 Passo 4: Mapear Usuários

Você precisa mapear cada usuário do Slack para seu ID correspondente no Jibble.

### 4.1 Obter Slack User IDs

**Método 1 - Via Interface:**
1. No Slack, clique no perfil do usuário
2. Clique nos três pontos (⋯)
3. Selecione **"Copy member ID"**

**Método 2 - Via API:**
```bash
curl -H "Authorization: Bearer xoxb-seu-token" \
  https://slack.com/api/users.list
```

### 4.2 Obter Jibble User IDs

Consulte a documentação da API do Jibble ou o painel administrativo.

### 4.3 Criar Mapeamentos

**Opção 1 - Via API (Recomendado):**
```bash
curl -X POST http://localhost:3000/slack/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "slackUserId": "U123ABC",
    "jibbleUserId": "jibble-user-id-123"
  }'
```

**Opção 2 - Editar código:**
Edite `src/services/userMappingService.js`:
```javascript
this.mappings.set('U123ABC', 'jibble-user-id-123');
this.mappings.set('U456DEF', 'jibble-user-id-456');
```

## 🏃 Passo 5: Executar

### 5.1 Iniciar Servidor

```bash
npm run dev
```

Você deve ver:
```
🚀 Servidor rodando na porta 3000
📡 Webhook do Slack: http://localhost:3000/slack/events
🌍 Configure esta URL no Slack Event Subscriptions
```

### 5.2 Testar

1. Entre no canal configurado (`SLACK_CHANNEL_ID`) no Slack
2. Verifique os logs do servidor
3. Verifique se o clock-in foi feito no Jibble
4. Saia do canal e verifique o clock-out

### 5.3 Verificar Estatísticas

```bash
curl http://localhost:3000/slack/stats
```

## 🐛 Troubleshooting

### Webhook não recebe eventos

- ✅ Verifique se a URL está correta no Slack Event Subscriptions
- ✅ Confirme que o ngrok está rodando (se em desenvolvimento)
- ✅ Verifique os logs do servidor
- ✅ Teste o endpoint `/health`

### Erro de assinatura inválida

- ✅ Confirme que `SLACK_SIGNING_SECRET` está correto
- ✅ Verifique se o middleware de autenticação está aplicado

### Clock-in não funciona

- ✅ Verifique se `JIBBLE_API_KEY` está correto
- ✅ Confirme se o endpoint da API está correto
- ✅ Verifique se o usuário tem mapeamento configurado
- ✅ Consulte os logs para erros específicos da API

### Eventos de outros canais sendo processados

- ✅ Confirme que `SLACK_CHANNEL_ID` está configurado corretamente
- ✅ Verifique se o ID do canal está correto (começa com `C`)

## 📚 Próximos Passos

- [ ] Configurar banco de dados para mapeamentos persistentes
- [ ] Adicionar interface web para gerenciar mapeamentos
- [ ] Implementar retry logic para chamadas de API
- [ ] Adicionar métricas e monitoramento
- [ ] Configurar deploy em produção
