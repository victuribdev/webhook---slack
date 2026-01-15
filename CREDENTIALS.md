# 🔑 Como Obter Credenciais

Este guia detalha onde encontrar cada credencial necessária para configurar o sistema.

## 📱 Credenciais do Slack

### SLACK_BOT_TOKEN

1. Acesse https://api.slack.com/apps
2. Clique em **"Create New App"** ou **"Criar novo aplicativo"**
3. **Escolha "Do zero" (From scratch)** - NÃO escolha "De um manifesto"
4. Preencha:
   - **Nome do App**: `Jibble Automation Bot` (ou qualquer nome)
   - **Workspace**: Selecione seu workspace
5. Clique em **"Create App"** ou **"Criar aplicativo"**
6. Vá em **"OAuth & Permissions"** no menu lateral
7. Em **"Bot Token Scopes"**, clique em **"Add an OAuth Scope"** e adicione:
   - ✅ `users:read` - Para ler informações de usuários (ESSENCIAL)
   - ✅ `users:read.email` - Para ler emails dos usuários (ESSENCIAL - para mapeamento automático)
   - ✅ `users:read.presence` - Para ler status de presença (ESSENCIAL - procure por "presence")
   - ✅ `users.profile:write` - Para atualizar status dos usuários (ESSENCIAL)
   - ✅ `chat:write` - Para enviar mensagens aos usuários (ESSENCIAL - para avisos de inatividade)
   - ✅ `channels:history` - Para receber eventos de mensagens em canais públicos
   - ✅ `groups:history` - Para receber eventos de mensagens em canais privados
   - ✅ `im:history` - Para receber eventos de mensagens diretas
   - ✅ `mpim:history` - Para receber eventos de mensagens em grupos diretos
8. Clique em **"Save Changes"** ou **"Salvar alterações"**
9. Role até **"OAuth Tokens for Your Workspace"** ou **"Tokens OAuth para seu workspace"**
10. Clique em **"Install to Workspace"** ou **"Instalar no workspace"**
11. Autorize as permissões
12. Copie o **"Bot User OAuth Token"** (começa com `xoxb-`)
13. Cole no `.env` como `SLACK_BOT_TOKEN`

**Exemplo**: `xoxb-1234567890-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx`

### SLACK_SIGNING_SECRET

1. Acesse https://api.slack.com/apps
2. Selecione seu app (o que você acabou de criar)
3. Vá em **"Basic Information"** ou **"Informações básicas"** no menu lateral
4. Role até **"App Credentials"** ou **"Credenciais do aplicativo"**
5. Copie o **"Signing Secret"** (você pode precisar clicar em "Show" para revelar)
6. Cole no `.env` como `SLACK_SIGNING_SECRET`

**Exemplo**: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`

### SLACK_CHANNEL_ID

**Método 1 - Via Interface do Slack:**
1. No Slack, clique com botão direito no canal que deseja monitorar
2. Selecione **"View channel details"** ou **"Ver detalhes do canal"**
3. Role até o final da página
4. Copie o **"Channel ID"** (começa com `C`)

**Método 2 - Via URL:**
1. Abra o canal no navegador
2. A URL será: `https://workspace.slack.com/archives/C1234567890`
3. O `C1234567890` é o Channel ID

**Método 3 - Via API:**
```bash
curl -H "Authorization: Bearer xoxb-seu-token" \
  https://slack.com/api/conversations.list
```

Procure pelo canal na resposta e copie o `id`.

**Exemplo**: `C1234567890`

## ⏰ Credenciais do Jibble (OAuth 2.0)

O Jibble usa OAuth 2.0 Client Credentials flow. Você precisa de Client ID e Client Secret.

### JIBBLE_CLIENT_ID

1. Acesse o painel administrativo do Jibble
2. Vá em **Settings** → **API** ou **Integrations**
3. Crie uma nova **API Key** ou **Client Credentials**
4. Copie o **Client ID** (ID da Chave de API)
5. Cole no `.env` como `JIBBLE_CLIENT_ID`

**Exemplo**: `137a0228-a9ee-4ad0-b593-dc19557a6b55`

### JIBBLE_CLIENT_SECRET

1. Na mesma página onde você criou a API Key
2. Copie o **Client Secret** (Segredo da Chave API)
3. ⚠️ **IMPORTANTE**: Guarde com segurança! Não será exibido novamente
4. Cole no `.env` como `JIBBLE_CLIENT_SECRET`

**Exemplo**: `O0i9WitxxtiMWnybCH2h3SFtu1rXRa4gnSG01WyhMX6i-qfe`

### JIBBLE_API_URL

URL base da API do Jibble:
- **Produção**: `https://api.prod.jibble.io`
- **Teste**: `https://api.test.jibble.io` (se disponível)

### JIBBLE_IDENTITY_URL

URL do servidor de autenticação OAuth:
- **Produção**: `https://identity.prod.jibble.io`
- **Teste**: `https://identity.test.jibble.io` (se disponível)

### JIBBLE_ORG_ID (Opcional)

O Organization ID geralmente vem na resposta do token OAuth. Mas você pode configurar manualmente:

**Método 1 - Via Resposta do Token:**
Quando você obtém o access token, a resposta inclui `organizationId`. O sistema salva automaticamente.

**Método 2 - Via Painel:**
1. Acesse o painel administrativo do Jibble
2. Vá em **Settings** → **Organization**
3. Procure pelo **Organization ID**

**Exemplo**: `7e29c52a-da8e-49f4-ad16-609f9f37d32d`

## 🔍 Verificando Credenciais

### Testar Slack Bot Token

```bash
curl -H "Authorization: Bearer xoxb-seu-token" \
  https://slack.com/api/auth.test
```

Deve retornar informações sobre o bot.

### Testar Jibble OAuth 2.0

Primeiro, obtenha um access token:

```bash
curl --location 'https://identity.prod.jibble.io/connect/token' \
--header 'Accept: application/json' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'client_id=SEU_CLIENT_ID' \
--data-urlencode 'client_secret=SEU_CLIENT_SECRET'
```

Depois, use o access_token retornado:

```bash
curl -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  https://api.prod.jibble.io/api/Members
```

Deve retornar lista de membros (ou erro de autenticação se inválido).

## ⚠️ Segurança

- **NUNCA** commite o arquivo `.env` no Git
- **NUNCA** compartilhe suas credenciais publicamente
- **SEMPRE** use variáveis de ambiente em produção
- **ROTACIONE** as chaves periodicamente
- **USE** diferentes credenciais para dev/staging/prod

## 🆘 Problemas Comuns

### "Invalid token" no Slack

- Verifique se copiou o token completo (começa com `xoxb-`)
- Confirme que o app está instalado no workspace
- Verifique se o token não expirou

### "Unauthorized" no Jibble

- Verifique se a API Key está correta
- Confirme se a API Key tem as permissões necessárias
- Verifique se não há espaços extras ao copiar

### "Channel not found"

- Confirme que o Channel ID está correto (começa com `C`)
- Verifique se o bot tem acesso ao canal
- Certifique-se de que o bot está no workspace correto
