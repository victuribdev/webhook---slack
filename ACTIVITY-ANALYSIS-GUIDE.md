# 📊 Guia de Análise de Atividade

Este guia explica como gerar e interpretar relatórios de atividade.

## 🚀 Gerando Relatórios

### Comandos Disponíveis

```bash
# Gerar relatório de hoje
npm run report

# Listar arquivos de log disponíveis
npm run report:list

# Gerar relatório de data específica
npm run report 2026-01-14
```

### Exemplo de Uso

```bash
# 1. Ver quais dias têm dados
npm run report:list

# Saída:
# 📁 Arquivos de log disponíveis:
#    1. 2026-01-14 (activity-2026-01-14.json)
#    2. 2026-01-13 (activity-2026-01-13.json)

# 2. Gerar relatório do dia desejado
npm run report 2026-01-14

# Saída:
# ✅ Relatórios gerados com sucesso!
#    📄 JSON: data/reports/report-2026-01-14.json
#    🌐 HTML: data/reports/report-2026-01-14.html
```

## 📂 Estrutura de Arquivos

```
data/
├── activity-logs/              # Logs brutos (JSON)
│   ├── activity-2026-01-14.json
│   └── activity-2026-01-15.json
└── reports/                    # Relatórios gerados
    ├── report-2026-01-14.json  # Dados estruturados
    └── report-2026-01-14.html  # Visualização bonita
```

## 📊 Entendendo o Relatório

### Relatório JSON

Estrutura do arquivo `report-YYYY-MM-DD.json`:

```json
{
  "date": "2026-01-14",
  "totalEvents": 1247,
  "uniqueUsers": 15,
  "users": [
    {
      "userId": "U123ABC",
      "totalEvents": 342,
      "totalSessions": 4,
      "totalActiveTime": 387.5,
      "totalActiveTimeFormatted": "6h 27min",
      "eventTypeCounts": {
        "message": 298,
        "presence_change": 24,
        "channel_join": 12,
        "huddle_start": 8
      },
      "sessions": [
        {
          "start": "2026-01-14T09:15:23.000Z",
          "end": "2026-01-14T12:42:18.000Z",
          "duration": 206.9,
          "durationFormatted": "3h 26min",
          "eventCount": 156
        }
      ]
    }
  ]
}
```

### Relatório HTML

O arquivo HTML é uma visualização visual e interativa do relatório JSON. Abra no navegador para ver:

- **Resumo Geral**: Total de eventos, usuários ativos, sessões
- **Cards por Usuário**: Tempo ativo, eventos, sessões
- **Timeline de Sessões**: Horários de início/fim de cada sessão
- **Tipos de Eventos**: Breakdown de mensagens, calls, etc

## 🧮 Como Funciona a Análise

### 1. Detecção de Sessões

O sistema agrupa eventos em "sessões de atividade":

- **Sessão**: Cluster de eventos próximos no tempo
- **Gap Máximo**: 30 minutos (configurável)
- **Lógica**: Se passar mais de 30min sem evento, considera nova sessão

**Exemplo:**
```
09:00 - Mensagem
09:15 - Mensagem
09:45 - Mensagem
[GAP de 35 minutos]
10:20 - Mensagem  ← Nova sessão
10:30 - Mensagem
```

Resultado: **2 sessões**
- Sessão 1: 09:00 - 09:45 (45min)
- Sessão 2: 10:20 - 10:30 (10min)

### 2. Cálculo de Tempo Ativo

**Tempo Ativo** = Soma da duração de todas as sessões

**Importante:** Não é "tempo de trabalho", é "tempo com atividade detectada".

### 3. Tipos de Eventos

| Evento | Significado |
|--------|-------------|
| `message` | Mensagem enviada (canal, DM, grupo) |
| `channel_join` | Entrou em um canal |
| `channel_leave` | Saiu de um canal |
| `presence_change` | Mudou status (online/away) |
| `huddle_start` | Entrou em call/huddle |
| `huddle_end` | Saiu de call/huddle |

## 📈 Interpretando os Dados

### Cenário 1: Alta Atividade

```json
{
  "userId": "U123ABC",
  "totalActiveTime": 420,  // 7h
  "totalSessions": 3,
  "totalEvents": 567
}
```

**Interpretação:**
- Usuário teve 3 sessões de trabalho
- Total de ~7h de atividade detectada
- Alta densidade de eventos (567 eventos)
- Provavelmente trabalhou o dia inteiro

### Cenário 2: Atividade Esporádica

```json
{
  "userId": "U456DEF",
  "totalActiveTime": 45,  // 45min
  "totalSessions": 8,
  "totalEvents": 23
}
```

**Interpretação:**
- Usuário teve 8 sessões curtas
- Total de apenas 45min de atividade
- Poucos eventos (23)
- Provavelmente não trabalhou muito ou estava offline

### Cenário 3: Sem Atividade

```json
{
  "userId": "U789GHI",
  "totalActiveTime": 0,
  "totalSessions": 0,
  "totalEvents": 0
}
```

**Interpretação:**
- Nenhum evento registrado
- Usuário não usou o Slack neste dia
- Pode estar de folga, férias, ou offline

## 🎯 Casos de Uso

### 1. Relatório Diário para Gestores

```bash
# Gera relatório de hoje
npm run report

# Abrir HTML no navegador
start data/reports/report-2026-01-14.html  # Windows
open data/reports/report-2026-01-14.html   # Mac
xdg-open data/reports/report-2026-01-14.html  # Linux
```

### 2. Análise Semanal

```bash
# Gera relatórios de segunda a sexta
npm run report 2026-01-13
npm run report 2026-01-14
npm run report 2026-01-15
npm run report 2026-01-16
npm run report 2026-01-17
```

### 3. Identificar Inatividade

Procure no JSON por usuários com:
- `totalActiveTime < 60` (menos de 1h)
- `totalEvents < 10` (poucos eventos)
- `totalSessions == 0` (sem sessões)

### 4. Exportar para Excel

O arquivo JSON pode ser importado em Excel/Google Sheets para análises mais complexas:

1. Abra Excel
2. Dados → Obter Dados → De Arquivo → De JSON
3. Selecione `report-YYYY-MM-DD.json`
4. Expanda as colunas conforme necessário

## ⚙️ Configurações Avançadas

### Alterar Gap de Sessão

Edite `src/services/activityAnalyzer.js`:

```javascript
constructor() {
  this.sessionGapMinutes = 30; // Altere aqui (padrão: 30min)
}
```

**Exemplos:**
- `15` - Sessões mais granulares (gap de 15min)
- `60` - Sessões mais longas (gap de 1h)

### Filtrar por Tipo de Evento

No código, você pode adicionar filtros personalizados:

```javascript
// Exemplo: Contar apenas mensagens
const messageEvents = userEvents[userId].filter(e => e.eventType === 'message');
```

## 🔒 Privacidade e Conformidade

**Lembre-se:**
- ✅ Este é um log de eventos, não controle de ponto
- ✅ Dados são para inferência, não cobrança
- ✅ Relatórios devem ser usados apenas por gestores/admin
- ❌ Não compartilhe relatórios com terceiros sem consentimento
- ❌ Não use para decisões de demissão baseadas apenas em tempo

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- `README-PASSIVE-MODE.md` - Documentação completa
- Logs do servidor - `npm run dev`
- Arquivos de log - `data/activity-logs/`
