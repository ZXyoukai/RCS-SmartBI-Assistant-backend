# SmartBI Assistant API - Documentação Completa

## Índice
- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Autenticação](#autenticação)
- [Endpoints da API](#endpoints-da-api)
- [Modelos de Dados](#modelos-de-dados)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Uso](#exemplos-de-uso)
- [Tratamento de Erros](#tratamento-de-erros)

## Visão Geral

A **SmartBI Assistant API** é uma plataforma robusta de Business Intelligence que integra inteligência artificial para conversão de linguagem natural para SQL, análise conversacional, geração de insights e análises preditivas.

### Principais Funcionalidades:
- **Conversão NL-to-SQL/SQL-to-NL** com Gemini AI
- **Conversação inteligente** com contexto
- **Geração automática de insights**
- **Análises preditivas**
- **Sistema de fallback robusto**
- **Cache inteligente de respostas**
- **Métricas e monitoramento**

### Base URL:
```
http://localhost:3001/api
```

##  Configuração

### Pré-requisitos:
- Node.js 18+
- PostgreSQL 12+
- Conta Google AI (Gemini API)

### Instalação:
```bash
# Clonar repositório
git clone https://github.com/ZXyoukai/RCS-SmartBI-Assistant-backend.git
cd RCS-SmartBI-Assistant-backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npm run db:migrate
npm run seed
npm run init-fallbacks

# Iniciar servidor
npm start
```

### Variáveis de Ambiente Essenciais:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/smartbi"
GEMINI_API_KEY="sua_chave_gemini_aqui"
JWT_SECRET="seu_jwt_secret_super_seguro"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

## Autenticação

A API usa **JWT (JSON Web Tokens)** para autenticação.

### Header de Autorização:
```
Authorization: Bearer <seu_jwt_token>
```

### Obter Token:
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

## Endpoints da API

### Autenticação (`/auth`)

#### Registrar Usuário
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "id": 1,
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usuários (`/users`)

#### Listar Usuários
```http
GET /users
Authorization: Bearer <token>
```

#### Obter Usuário por ID
```http
GET /users/:id
```

#### Criar Usuário
```http
POST /users
Content-Type: application/json

{
  "name": "Nome",
  "email": "email@exemplo.com",
  "password": "senha"
}
```

### Inteligência Artificial (`/ai`)

#### Converter Linguagem Natural para SQL
```http
POST /ai/nl2sql
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "Mostrar todos os usuários criados hoje",
  "sessionId": 123,
  "language": "pt-BR",
  "databaseId": 1, // Novo: seleciona banco associado
  "viewType": "table" // Opcional: table, dashboard, chart
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "sql": "SELECT * FROM users WHERE DATE(created_at) = CURRENT_DATE",
    "explanation": "Esta consulta busca todos os usuários criados hoje",
    "confidence": 0.95,
    "sessionId": 123,
    "interactionId": 456,
    "executionTime": 1200,
    "fromCache": false,
    "fallbackUsed": false,
    "queryResult": {
      "type": "table",
      "columns": ["id", "name", "email", "created_at"],
      "rows": [
        { "id": 1, "name": "João", "email": "joao@exemplo.com", "created_at": "2023-09-23T10:00:00Z" }
      ]
    }
  }
}
```

#### Converter SQL para Linguagem Natural
```http
POST /ai/sql2nl
Authorization: Bearer <token>
Content-Type: application/json

{
  "sqlQuery": "SELECT COUNT(*) FROM users WHERE created_at > '2023-01-01'",
  "sessionId": 123,
  "language": "pt-BR"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "explanation": "Esta consulta conta quantos usuários foram criados após 1º de janeiro de 2023",
    "confidence": 0.92,
    "sessionId": 123,
    "interactionId": 457,
    "executionTime": 800,
    "fromCache": false
  }
}
```

#### Validar Consulta SQL
```http
POST /ai/validate-sql
Authorization: Bearer <token>
Content-Type: application/json

{
  "sqlQuery": "SELECT * FROM users WHERE id = 1"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "suggestions": ["Considere especificar colunas específicas ao invés de usar *"],
    "query": "SELECT * FROM users WHERE id = 1"
  }
}
```

#### Histórico de Interações com IA
```http
GET /ai/history?page=1&limit=20&interactionType=nl2sql&startDate=2023-01-01
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "interactions": [
      {
        "id": 123,
        "type": "nl2sql",
        "input": "Mostrar usuários ativos",
        "status": "success",
        "confidence": 0.89,
        "executionTime": 1100,
        "fallbackUsed": false,
        "createdAt": "2023-01-15T10:30:00.000Z",
        "session": {
          "session_token": "chat_1234567890_abc123",
          "status": "active"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    },
    "stats": {
      "nl2sql": {
        "success": 45,
        "error": 2,
        "fallback": 1
      }
    }
  }
}
```

#### Métricas de Performance da IA
```http
GET /ai/metrics?period=30d
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalInteractions": 1250,
      "successfulInteractions": 1180,
      "successRate": 94,
      "avgExecutionTime": 890,
      "avgConfidence": 0.87,
      "fallbackUsage": 35,
      "fallbackRate": 3
    },
    "interactionsByType": [
      {"type": "nl2sql", "count": 650},
      {"type": "conversation", "count": 400},
      {"type": "sql2nl", "count": 200}
    ],
    "dailyStats": [
      {
        "date": "2023-01-15",
        "total": 45,
        "successful": 42,
        "successRate": 93
      }
    ],
    "period": "30d"
  }
}
```

#### Limpar Cache da IA
```http
DELETE /ai/cache
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "expired"
}
```

### Conversação (`/conversation`)

#### Iniciar Sessão de Conversa
```http
POST /conversation/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "contextData": {
    "domain": "sales",
    "timeframe": "monthly"
  },
  "sessionType": "analytics"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "sessionId": 789,
    "sessionToken": "chat_1642678900_xyz789",
    "message": "Sessão de conversa iniciada com sucesso!",
    "instructions": "Você pode fazer perguntas sobre dados, solicitar conversões NL-to-SQL, ou pedir insights e análises."
  }
}
```

#### Enviar Mensagem na Conversa
```http
POST /conversation/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": 789,
  "message": "Quais são as tendências de vendas dos últimos 3 meses?",
  "language": "pt-BR"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "response": "Com base nos dados disponíveis, posso analisar as tendências de vendas. Vou gerar insights específicos sobre os últimos 3 meses...",
    "interactionType": "insight_request",
    "confidence": 0.91,
    "suggestions": [
      "Tente especificar um produto ou categoria específica",
      "Considere filtrar por região ou canal de vendas"
    ],
    "insights": [
      "Detectado padrão de crescimento sazonal",
      "Pico de vendas identificado no mês anterior"
    ],
    "executionTime": 1450,
    "interactionId": 234,
    "sessionId": 789
  }
}
```

#### Gerar Insights
```http
POST /conversation/insights
Authorization: Bearer <token>
Content-Type: application/json

{
  "analysisType": "trend_analysis",
  "parameters": {
    "period": "30d",
    "category": "user_behavior"
  },
  "sessionId": 789
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": 101,
        "type": "trend_analysis",
        "title": "Aumento na Atividade de Usuários",
        "description": "Observamos um crescimento de 23% na atividade de usuários nos últimos 30 dias, com pico nos fins de semana.",
        "confidenceLevel": "high",
        "impactScore": 0.85,
        "status": "active"
      }
    ],
    "analysisType": "trend_analysis",
    "executionTime": 2100,
    "generatedAt": "2023-01-15T14:30:00.000Z"
  }
}
```

#### Análise Preditiva
```http
POST /conversation/predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "predictionType": "usage_trend",
  "timeframe": "30d",
  "parameters": {
    "includeSeasonality": true,
    "confidenceInterval": 0.95
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "prediction": {
      "trend": "increasing",
      "expectedGrowth": "15-20%",
      "peakPeriods": ["weekends", "month-end"],
      "riskFactors": ["seasonal_variation", "external_events"]
    },
    "confidence": 0.87,
    "reasoning": "Baseado em dados históricos dos últimos 90 dias, identificamos padrões consistentes de crescimento com sazonalidade semanal.",
    "recommendations": [
      "Prepare infraestrutura para picos de fim de semana",
      "Monitore métricas durante eventos externos",
      "Considere campanhas direcionadas para períodos de baixa"
    ],
    "predictionType": "usage_trend",
    "timeframe": "30d",
    "executionTime": 3200,
    "generatedAt": "2023-01-15T14:35:00.000Z"
  }
}
```

#### Listar Insights do Usuário
```http
GET /conversation/insights?page=1&limit=10&insightType=trend_analysis&confidenceLevel=high
Authorization: Bearer <token>
```

#### Histórico de Conversa
```http
GET /conversation/789/history?limit=50
Authorization: Bearer <token>
```

#### Sessões Ativas
```http
GET /conversation/sessions?status=active
Authorization: Bearer <token>
```

#### Encerrar Sessão
```http
PUT /conversation/789/end
Authorization: Bearer <token>
```

#### Atualizar Status de Insight
```http
PUT /conversation/insights/101/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "archived"
}
```

### Bancos Associados (`/exdatabase`)

#### Cadastrar Banco
```http
POST /exdatabase
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Banco BI",
  "url": "postgres://user:pass@host:5432/dbname",
  "schema": { "users": ["id", "name", "email"] },
  "description": "Banco de dados de BI read-only"
}
```

#### Testar Conexão (admin)
```http
POST /exdatabase/:id/test
Authorization: Bearer <token>
```

#### Executar Query Read-Only (admin)
```http
POST /exdatabase/:id/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "SELECT * FROM users LIMIT 10"
}
```

#### Consultar Schema
```http
GET /exdatabase/:id/schema
Authorization: Bearer <token>
```

### Fallbacks (admin)

#### Listar Fallbacks
```http
GET /fallbacks
Authorization: Bearer <token>
```

#### Criar/Atualizar/Deletar Fallback
```http
POST /fallbacks
PUT /fallbacks/:id
DELETE /fallbacks/:id
Authorization: Bearer <token>
```

### Consultas (`/queries`)

#### Listar Consultas
```http
GET /queries
Authorization: Bearer <token>
```

#### Obter Consulta por ID
```http
GET /queries/:id
Authorization: Bearer <token>
```

#### Deletar Consulta
```http
DELETE /queries/:id
Authorization: Bearer <token>
```

### Resultados (`/results`)

#### Obter Resultados por Query
```http
GET /results/query/:queryId
Authorization: Bearer <token>
```

#### Obter Resultado por ID
```http
GET /results/:id
Authorization: Bearer <token>
```

### Histórico (`/history`)

#### Listar Histórico
```http
GET /history
Authorization: Bearer <token>
```

#### Obter Histórico por ID
```http
GET /history/:id
Authorization: Bearer <token>
```

### Exports (`/exports`)

#### Listar Exports
```http
GET /exports
Authorization: Bearer <token>
```

### Sugestões (`/suggestions`)

#### Listar Sugestões
```http
GET /suggestions
Authorization: Bearer <token>
```

### Access Logs (`/access-logs`)

#### Listar Logs de Acesso
```http
GET /access-logs
Authorization: Bearer <token>
```

## Modelos de Dados

### Usuário (User)
```json
{
  "id": 1,
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "role": "user",
  "created_at": "2023-01-15T10:00:00.000Z"
}
```

### Sessão de Chat (AI Chat Session)
```json
{
  "id": 123,
  "user_id": 1,
  "session_token": "chat_1642678900_xyz789",
  "status": "active",
  "context_data": {
    "type": "analytics",
    "domain": "sales"
  },
  "created_at": "2023-01-15T10:00:00.000Z",
  "updated_at": "2023-01-15T10:30:00.000Z"
}
```

### Interação com IA (AI Interaction)
```json
{
  "id": 456,
  "session_id": 123,
  "user_id": 1,
  "interaction_type": "nl2sql",
  "input_text": "Mostrar usuários ativos",
  "input_language": "pt-BR",
  "processed_query": "SELECT * FROM users WHERE active = true",
  "ai_response": {
    "success": true,
    "response": "SELECT * FROM users WHERE active = true",
    "confidence": 0.95
  },
  "execution_status": "success",
  "execution_time_ms": 1200,
  "confidence_score": 0.95,
  "fallback_used": false,
  "version": "1.0",
  "created_at": "2023-01-15T10:15:00.000Z"
}
```

### Insight (AI Insight)
```json
{
  "id": 789,
  "interaction_id": 456,
  "user_id": 1,
  "insight_type": "trend_analysis",
  "title": "Crescimento de Usuários Ativos",
  "description": "Identificado crescimento de 15% nos usuários ativos...",
  "data_analysis": {
    "trend": "increasing",
    "percentage": 15,
    "period": "30d"
  },
  "confidence_level": "high",
  "impact_score": 0.85,
  "status": "active",
  "created_at": "2023-01-15T10:16:00.000Z"
}
```

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Requisição inválida |
| `401` | Não autenticado |
| `403` | Acesso negado |
| `404` | Não encontrado |
| `409` | Conflito (ex: email já existe) |
| `429` | Muitas requisições (rate limit) |
| `500` | Erro interno do servidor |
| `503` | Serviço indisponível |

## ⚡ Rate Limits

| Endpoint | Limite |
|----------|--------|
| Global | 1000 req/15min |
| IA (/ai/*) | 100 req/15min |
| Conversões (nl2sql/sql2nl) | 10 req/min |
| Conversação | 30 mensagens/min |
| Insights | 10 gerações/5min |

## Tratamento de Erros

### Estrutura de Erro Padrão:
```json
{
  "success": false,
  "error": "Descrição do erro",
  "details": ["Detalhes específicos do erro"],
  "code": "ERROR_CODE",
  "timestamp": "2023-01-15T10:00:00.000Z"
}
```

### Tipos de Erro Comuns:

#### Erro de Validação:
```json
{
  "success": false,
  "error": "Dados de entrada inválidos",
  "details": [
    {
      "field": "query",
      "message": "Consulta é obrigatória",
      "value": ""
    }
  ]
}
```

#### Erro de IA:
```json
{
  "success": false,
  "error": "Serviço de IA indisponível",
  "fallbackUsed": true,
  "fallbackMessage": "Não consegui processar sua consulta no momento. Tente novamente em alguns instantes.",
  "escalationLevel": 4
}
```

#### Erro de Rate Limit:
```json
{
  "success": false,
  "error": "Muitas requisições",
  "retryAfter": "15 minutes",
  "limit": 100,
  "window": "15 minutes"
}
```

## Exemplos de Uso Completos

### Fluxo Completo: NL-to-SQL
```javascript
// 1. Login
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
});
const { token } = await loginResponse.json();

// 2. Converter NL para SQL
const conversionResponse = await fetch('/ai/nl2sql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'Mostrar vendas do último mês por categoria',
    language: 'pt-BR'
  })
});
const result = await conversionResponse.json();
console.log('SQL gerado:', result.data.sql);
```

### Fluxo Completo: Sessão de Conversa
```javascript
// 1. Iniciar sessão
const sessionResponse = await fetch('/conversation/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionType: 'analytics',
    contextData: { domain: 'sales' }
  })
});
const { sessionId } = (await sessionResponse.json()).data;

// 2. Enviar mensagem
const messageResponse = await fetch('/conversation/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId,
    message: 'Analise as tendências de vendas do trimestre'
  })
});
const conversation = await messageResponse.json();

// 3. Gerar insights específicos
const insightsResponse = await fetch('/conversation/insights', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    analysisType: 'trend_analysis',
    sessionId,
    parameters: { period: '90d' }
  })
});
const insights = await insightsResponse.json();
```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia em modo desenvolvimento
npm start               # Inicia servidor principal
npm run prod            # Inicia em modo produção

# Banco de dados
npm run db:generate     # Gera cliente Prisma
npm run db:migrate      # Aplica migrações
npm run db:deploy       # Deploy de migrações (produção)
npm run db:reset        # Reset completo do banco
npm run seed            # Executa seeds

# IA e Fallbacks
npm run init-fallbacks  # Inicializa fallbacks padrão
npm run reset-fallbacks # Reset completo dos fallbacks
npm run fallback-stats  # Estatísticas dos fallbacks
npm run setup:ai        # Configuração completa da IA

# Utilitários
npm run setup:init      # Configuração inicial
npm run setup:clean     # Limpeza do projeto
npm run setup:health    # Verificação de saúde
```

## Recursos Adicionais

### Logs e Monitoramento:
- Logs estruturados de todas as interações com IA
- Métricas de performance em tempo real
- Alertas automáticos para falhas críticas

### Cache e Performance:
- Cache inteligente com hash MD5
- Expiração automática (24h padrão)
- Estatísticas de hit rate

### Segurança:
- Validação rigorosa de entrada
- Sanitização contra XSS
- Proteção contra SQL Injection
- Rate limiting adaptativo
- CORS configurado

### Sistema de Fallback:
- 24 templates pré-configurados
- Escalação automática (5 níveis)
- Distribuição de carga round-robin
- Análise de padrões de falha

---

## Suporte

Para dúvidas ou suporte:
- Email: suporte@smartbi.com
- Wiki: [Link para wiki]
- Issues: [GitHub Issues]

---

**Versão da API:** 1.0.0  
**Última atualização:** Setembro 2025  
**Licença:** MIT
