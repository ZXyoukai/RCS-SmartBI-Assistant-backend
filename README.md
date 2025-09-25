# 🤖 SmartBI Assistant - Backend API

API robusta para assistente de Business Intelligence com integração de IA, conversão NL-to-SQL, chat conversacional e geração de insights.

## 📚 Documentação Completa

- **[📖 Documentação da API](./API_DOCUMENTATION.md)** - Guia completo de todos os endpoints, autenticação e exemplos
- **[🏗️ Detalhes de Implementação](./IMPLEMENTATION_DETAILS.md)** - Arquitetura, tecnologias e decisões de design

## 🚀 Funcionalidades

### 🤖 Integração com IA
- **Conversão NL-to-SQL**: Converte linguagem natural para consultas SQL
- **Conversão SQL-to-NL**: Explica consultas SQL em linguagem natural
- **Chat Conversacional**: Interage com IA através de conversas contextuais
- **Geração de Insights**: Análises automáticas e detecção de padrões
- **Análise Preditiva**: Previsões baseadas em dados históricos

### 🛡️ Sistema de Fallback Inteligente
- Respostas automáticas para consultas não compreendidas
- Sistema de escalação baseado em níveis de confiança
- Templates personalizáveis de fallback
- Logging e analytics de fallbacks

### 🔒 Segurança e Performance
- Rate limiting inteligente para diferentes tipos de operação
- Validação rigorosa de entrada com Joi
- Sistema de cache para respostas da IA
- Sanitização de dados contra ataques XSS/SQL Injection
- Middleware de segurança com Helmet

### 📊 Analytics e Monitoramento
- Métricas detalhadas de performance da IA
- Histórico completo de interações
- Versionamento de interações para auditoria
- Sistema de logs estruturados

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 13+
- Chave da API do Google Gemini
- Redis (opcional, para cache avançado)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/ZXyoukai/RCS-SmartBI-Assistant-backend.git
cd RCS-SmartBI-Assistant-backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Configure o banco de dados
```bash
npm run db:generate
npm run db:migrate
```

### 5. Inicialize o sistema
```bash
npm run setup:init
```

### 6. Inicie o servidor
```bash
npm start
# ou para desenvolvimento:
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente Essenciais

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/smartbi"

# JWT
JWT_SECRET="sua_chave_secreta_muito_longa_e_aleatoria"

# Google Gemini AI
GEMINI_API_KEY="sua_chave_do_gemini"

# Servidor
PORT=3000
NODE_ENV="development"
```

### Configurações Opcionais

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AI_RATE_LIMIT_MAX=100

# Cache
AI_CACHE_EXPIRATION_HOURS=24

# Segurança
HELMET_ENABLED=true
CORS_ENABLED=true
```

## 📡 Endpoints da API

### 🤖 IA e Conversão (/ai)

#### Conversão NL-to-SQL
```http
POST /ai/nl2sql
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "Mostre todos os usuários criados esta semana",
  "sessionId": 123,
  "language": "pt-BR"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "sql": "SELECT * FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)",
    "explanation": "Esta consulta busca todos os usuários criados nos últimos 7 dias",
    "confidence": 0.85,
    "sessionId": 123,
    "executionTime": 245
  }
}
```

#### Conversão SQL-to-NL
```http
POST /ai/sql2nl
Content-Type: application/json
Authorization: Bearer <token>

{
  "sqlQuery": "SELECT COUNT(*) FROM users WHERE role = 'admin'",
  "sessionId": 123
}
```

#### Validação SQL
```http
POST /ai/validate-sql
Content-Type: application/json
Authorization: Bearer <token>

{
  "sqlQuery": "SELECT * FROM users"
}
```

#### Histórico de Interações
```http
GET /ai/history?page=1&limit=20&interactionType=nl2sql
Authorization: Bearer <token>
```

#### Métricas de Performance
```http
GET /ai/metrics?period=30d
Authorization: Bearer <token>
```

### 💬 Conversação e Chat (/conversation)

#### Iniciar Sessão
```http
POST /conversation/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "contextData": {
    "domain": "sales",
    "preferences": "detailed_analysis"
  },
  "sessionType": "analytics"
}
```

#### Enviar Mensagem
```http
POST /conversation/message
Content-Type: application/json
Authorization: Bearer <token>

{
  "sessionId": 123,
  "message": "Quais são as tendências de vendas este mês?",
  "language": "pt-BR"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "response": "Baseado nos dados disponíveis, observo três tendências principais...",
    "interactionType": "insight_request",
    "confidence": 0.92,
    "suggestions": [
      "Gostaria de ver dados específicos de algum produto?",
      "Posso gerar um relatório detalhado dessas tendências"
    ],
    "insights": [
      "Vendas aumentaram 15% comparado ao mês anterior",
      "Categoria 'eletrônicos' teve maior crescimento"
    ]
  }
}
```

#### Gerar Insights
```http
POST /conversation/insights
Content-Type: application/json
Authorization: Bearer <token>

{
  "analysisType": "trend_analysis",
  "parameters": {
    "timeframe": "30d",
    "categories": ["sales", "users"]
  }
}
```

#### Análise Preditiva
```http
POST /conversation/predict
Content-Type: application/json
Authorization: Bearer <token>

{
  "predictionType": "usage_trend",
  "timeframe": "30d",
  "parameters": {
    "includeSeasonality": true
  }
}
```

### 📊 Gerenciamento de Insights

#### Listar Insights
```http
GET /conversation/insights?page=1&limit=10&insightType=trend_analysis
Authorization: Bearer <token>
```

#### Atualizar Status do Insight
```http
PUT /conversation/insights/123/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "archived"
}
```

## 🔍 Monitoramento e Debugging

### Health Check
```http
GET /health
```

### Informações da API
```http
GET /api/info
```

### Scripts de Manutenção

```bash
# Verificar saúde do sistema
npm run setup:health

# Limpar dados de desenvolvimento
npm run setup:clean

# Reinicializar sistema
npm run setup:init
```

## 🛡️ Sistema de Fallback

O sistema inclui fallbacks inteligentes para diferentes cenários:

- **Baixa Confiança**: Quando a IA não tem certeza da resposta
- **Não Compreensão**: Quando não consegue entender a entrada
- **Erro de Sistema**: Quando há falhas técnicas
- **Timeout**: Quando operações demoram muito

## 📈 Rate Limiting

### Limites por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Global | 1000 req | 15 min |
| IA (/ai/*) | 100 req | 15 min |
| Conversões | 10 req | 1 min |
| Conversação | 30 req | 1 min |
| Insights | 10 req | 5 min |

## 🔒 Segurança

### Autenticação
Todas as rotas protegidas requerem token JWT no header:
```http
Authorization: Bearer <jwt_token>
```

### Validação de Entrada
- Sanitização automática de XSS
- Validação rigorosa com Joi
- Bloqueio de SQL Injection
- Limite de tamanho de payload

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia em modo desenvolvimento
npm start               # Inicia servidor
npm run prod            # Inicia em produção

# Banco de Dados  
npm run db:generate     # Gera client Prisma
npm run db:migrate      # Aplica migrations (dev)
npm run db:deploy       # Aplica migrations (prod)
npm run db:reset        # Reset completo do banco

# Sistema
npm run setup:init      # Inicializa sistema completo
npm run setup:health    # Verifica saúde do sistema
npm run setup:clean     # Limpa dados de desenvolvimento

# Utilitários
npm run seed           # Popula banco com dados iniciais
```

## 🚀 Deploy e Produção

### Preparação
```bash
npm run db:deploy      # Aplica migrations
npm run setup:init     # Inicializa sistema
npm run prod          # Inicia em produção
```

### Variáveis de Produção
```env
NODE_ENV=production
LOG_LEVEL=warn
DEBUG_AI_RESPONSES=false
```
- Cadastro e autenticação de usuários
- Gerenciamento de queries e resultados
- Histórico de execuções
- Exportação de dados
- Sugestões e logs de acesso

---

## Instalação

```bash
git clone https://github.com/seu-usuario/rcs-smartbi-assistant.git
cd rcs-smartbi-assistant
npm install
```

---

## Configuração

1. Configure o banco de dados PostgreSQL e adicione a URL no arquivo `.env`:

   ```
   DATABASE_URL="postgresql://usuario:senha@host:porta/database"
   ```

2. Execute as migrações do Prisma:

   ```bash
   npx prisma migrate dev --name init
   ```

---

## Execução

```bash
npm run dev
```
ou
```bash
npx nodemon src/server.js
```

---

## Estrutura da API

- **Autenticação JWT**: rotas protegidas exigem o header `Authorization: Bearer <token>`.
- **Modelos**: users, queries, results, history, exports, suggestions, access_logs.

---

## Autenticação

- **Registro:** `POST /auth/register`
- **Login:** `POST /auth/login`  
  Ambos retornam um token JWT para uso nas rotas protegidas.

Exemplo de uso do token:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## Endpoints Principais

### Usuários
- `GET /users` — Lista usuários (protegido)
- `GET /users/:id` — Detalhes do usuário (protegido)
- `PUT /users/:id` — Atualiza usuário (protegido)
- `DELETE /users/:id` — Remove usuário (protegido)

### Queries
- `GET /queries` — Lista queries do usuário (protegido)
- `POST /queries` — Cria query (protegido)
- `GET /queries/:id` — Detalhes da query (protegido)
- `DELETE /queries/:id` — Remove query (protegido)

### Results
- `GET /results?query_id=ID` — Lista resultados (protegido)
- `POST /results` — Adiciona resultado (protegido)

### History
- `GET /history` — Histórico do usuário (protegido)

### Exports
- `GET /exports` — Lista exports (protegido)
- `POST /exports` — Cria export (protegido)

### Sugestões
- `GET /suggestions` — Lista sugestões (protegido)
- `POST /suggestions` — Cria sugestão (protegido)

### Logs de Acesso
- `GET /access-logs` — Lista logs do usuário (protegido)

---

## Documentação Completa

Veja o arquivo [`docs/api-documentation.html`](docs/api-documentation.html) para exemplos de payloads, respostas e detalhes de cada rota.

---