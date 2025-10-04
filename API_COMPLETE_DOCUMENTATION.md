# RCS Smart BI Assistant - Documentação Completa da API

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Estrutura de Resposta](#estrutura-de-resposta)
- [Endpoints de IA](#endpoints-de-ia)
- [Endpoints de Favoritos](#endpoints-de-favoritos)
- [Endpoints de Upload e Bases de Dados](#endpoints-de-upload-e-bases-de-dados)
- [Endpoints de Conversação](#endpoints-de-conversação)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Uso](#exemplos-de-uso)
- [Rate Limiting](#rate-limiting)

---

## 🔍 Visão Geral

O RCS Smart BI Assistant é uma API REST robusta que oferece:
- **Conversão NL2SQL**: Converte linguagem natural em consultas SQL
- **Geração de Mermaid**: Cria diagramas Mermaid automaticamente
- **Auto-correção**: Sistema híbrido de correção de erros com IA
- **Upload de Dados**: Suporte para CSV, Excel, SQL, JSON
- **Conexões de BD**: PostgreSQL, MySQL, SQLite
- **Sistema de Favoritos**: Gestão de interações favoritas
- **Cache Inteligente**: Otimização de performance

**Base URL**: `https://seu-dominio.com/api`

---

## 🔐 Autenticação

Todas as rotas requerem autenticação via JWT Token no header:

```http
Authorization: Bearer seu_jwt_token_aqui
```

### Como obter um token:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "usuario@exemplo.com",
      "name": "João Silva"
    }
  }
}
```

---

## 📦 Estrutura de Resposta

Todas as respostas seguem o padrão:

### ✅ Sucesso
```json
{
  "success": true,
  "data": {
    // dados da resposta
  },
  "meta": {
    // metadados opcionais (paginação, etc.)
  }
}
```

### ❌ Erro
```json
{
  "success": false,
  "error": "Mensagem de erro descritiva",
  "details": {
    // detalhes opcionais do erro
  }
}
```

---

## 🤖 Endpoints de IA

### 1. Conversão Natural para SQL

**Converte texto em linguagem natural para consulta SQL**

```http
POST /api/ai/nl2sql
Content-Type: application/json
```

**Body:**
```json
{
  "prompt": "Mostre-me todos os usuários ativos",
  "databaseId": 1,
  "schema": {
    "users": {
      "columns": ["id", "name", "email", "active"],
      "types": ["INTEGER", "VARCHAR", "VARCHAR", "BOOLEAN"]
    }
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "sql": "SELECT * FROM users WHERE active = true;",
    "explanation": "Esta consulta seleciona todos os usuários onde o campo 'active' é verdadeiro",
    "interactionId": 123,
    "metadata": {
      "tables_used": ["users"],
      "complexity": "simple",
      "estimated_rows": "~100"
    }
  }
}
```

### 2. Conversão SQL para Natural

**Explica uma consulta SQL em linguagem natural**

```http
POST /api/ai/sql2nl
Content-Type: application/json
```

**Body:**
```json
{
  "sql": "SELECT COUNT(*) FROM orders WHERE status = 'completed' AND created_at > '2024-01-01'",
  "databaseId": 1
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "explanation": "Esta consulta conta o número total de pedidos que foram concluídos após 1º de janeiro de 2024",
    "interactionId": 124,
    "metadata": {
      "query_type": "aggregation",
      "tables_analyzed": ["orders"]
    }
  }
}
```

### 3. Geração de Diagrama Mermaid

**Gera diagramas Mermaid com auto-correção**

```http
POST /api/ai/mermaid
Content-Type: application/json
```

**Body:**
```json
{
  "prompt": "Crie um diagrama de fluxo do processo de checkout",
  "diagramType": "flowchart",
  "databaseId": 1
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "mermaidCode": "flowchart TD\n    A[Início] --> B[Adicionar ao Carrinho]\n    B --> C[Inserir Dados]\n    C --> D[Pagamento]\n    D --> E[Confirmação]",
    "corrected": false,
    "interactionId": 125,
    "metadata": {
      "diagram_type": "flowchart",
      "nodes_count": 5,
      "auto_corrected": false
    }
  }
}
```

### 4. Execução de Consulta com Auto-correção

**Executa SQL com correção automática de erros**

```http
POST /api/ai/execute
Content-Type: application/json
```

**Body:**
```json
{
  "sql": "SELECT * FROM user WHERE active = 1",
  "databaseId": 1,
  "autoCorrect": true
}
```

**Resposta (com correção):**
```json
{
  "success": true,
  "data": {
    "results": [
      {"id": 1, "name": "João", "email": "joao@test.com", "active": true}
    ],
    "corrected": true,
    "originalSql": "SELECT * FROM user WHERE active = 1",
    "correctedSql": "SELECT * FROM users WHERE active = true",
    "correctionReason": "Tabela 'user' não existe, corrigido para 'users'. Valor booleano corrigido.",
    "metadata": {
      "execution_time": "45ms",
      "rows_returned": 1
    }
  }
}
```

### 5. Limpeza de Cache

**Remove entradas específicas ou todo o cache**

```http
DELETE /api/ai/cache
Content-Type: application/json
```

**Body (opcional):**
```json
{
  "keys": ["cache_key_1", "cache_key_2"],
  "pattern": "user_*"
}
```

---

## ⭐ Endpoints de Favoritos

### 1. Marcar/Desmarcar Favorito

**Toggle do status de favorito de uma interação**

```http
PUT /api/ai/favorites/123
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "interactionId": 123,
    "isFavorite": true,
    "message": "Interação adicionada aos favoritos"
  }
}
```

### 2. Listar Favoritos

**Lista todas as interações favoritas com paginação e filtros**

```http
GET /api/ai/favorites?page=1&limit=20&interactionType=nl2sql&sortBy=created_at&sortOrder=desc
```

**Parâmetros de Query:**
- `page` (int): Página (padrão: 1)
- `limit` (int): Itens por página (1-100, padrão: 20)
- `interactionType` (string): nl2sql, sql2nl, mermaid
- `sortBy` (string): created_at, updated_at
- `sortOrder` (string): asc, desc

**Resposta:**
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": 123,
        "type": "nl2sql",
        "prompt": "Mostre todos os usuários",
        "result": "SELECT * FROM users;",
        "created_at": "2024-01-15T10:30:00Z",
        "metadata": {
          "tables_used": ["users"],
          "complexity": "simple"
        }
      }
    ]
  },
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 3. Remover Múltiplos Favoritos

**Remove várias interações dos favoritos de uma vez**

```http
DELETE /api/ai/favorites
Content-Type: application/json
```

**Body:**
```json
{
  "interactionIds": [123, 124, 125]
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "removedCount": 3,
    "failedIds": [],
    "message": "3 interações removidas dos favoritos"
  }
}
```

### 4. Estatísticas de Favoritos

**Obtém estatísticas detalhadas dos favoritos**

```http
GET /api/ai/favorites/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "byType": {
      "nl2sql": 20,
      "sql2nl": 15,
      "mermaid": 10
    },
    "byPeriod": {
      "last_7_days": 5,
      "last_30_days": 15,
      "last_90_days": 35
    },
    "mostUsedTables": [
      {"table": "users", "count": 12},
      {"table": "orders", "count": 8}
    ],
    "averageComplexity": "medium"
  }
}
```

---

## 📁 Endpoints de Upload e Bases de Dados

### 1. Upload de Arquivo

**Suporta CSV, Excel (.xlsx, .xls), SQL, JSON**

```http
POST /api/associated-databases/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Arquivo a ser enviado
- `name`: Nome para a base de dados
- `description`: Descrição (opcional)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "databaseId": 15,
    "name": "Vendas Q1 2024",
    "type": "csv",
    "schema": {
      "columns": [
        {"name": "id", "type": "INTEGER"},
        {"name": "product", "type": "VARCHAR"},
        {"name": "quantity", "type": "INTEGER"},
        {"name": "price", "type": "DECIMAL"}
      ]
    },
    "rowCount": 1520,
    "fileSize": "245KB"
  }
}
```

### 2. Testar Conexão de BD

**Testa conectividade com PostgreSQL, MySQL, SQLite**

```http
POST /api/associated-databases/test-connection
Content-Type: application/json
```

**Body:**
```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "empresa_db",
  "username": "admin",
  "password": "senha123",
  "ssl": false
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "responseTime": "89ms",
    "version": "PostgreSQL 15.3",
    "schemaInfo": {
      "tables": 12,
      "views": 3,
      "procedures": 5
    }
  }
}
```

### 3. Conectar Base de Dados

**Estabelece conexão permanente e extrai schema**

```http
POST /api/associated-databases/connect
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Base Produção",
  "type": "postgresql",
  "connectionConfig": {
    "host": "db.empresa.com",
    "port": 5432,
    "database": "production",
    "username": "readonly_user",
    "password": "senha_segura"
  },
  "description": "Base de dados de produção - apenas leitura"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "databaseId": 16,
    "name": "Base Produção",
    "type": "postgresql",
    "status": "connected",
    "schema": {
      "users": {
        "columns": ["id", "name", "email", "created_at"],
        "types": ["INTEGER", "VARCHAR", "VARCHAR", "TIMESTAMP"]
      },
      "orders": {
        "columns": ["id", "user_id", "total", "status"],
        "types": ["INTEGER", "INTEGER", "DECIMAL", "VARCHAR"]
      }
    },
    "tableCount": 8
  }
}
```

### 4. Pré-visualização de Dados

**Mostra amostra dos dados de uma tabela**

```http
GET /api/associated-databases/15/preview?table=users&limit=10
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "table": "users",
    "columns": ["id", "name", "email", "active"],
    "sample": [
      {"id": 1, "name": "João Silva", "email": "joao@test.com", "active": true},
      {"id": 2, "name": "Maria Santos", "email": "maria@test.com", "active": false}
    ],
    "totalRows": 1520,
    "sampleSize": 10
  }
}
```

---

## 💬 Endpoints de Conversação

### 1. Criar Nova Conversa

```http
POST /api/conversations
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Análise de Vendas Q1",
  "databaseId": 15
}
```

### 2. Listar Conversas

```http
GET /api/conversations?page=1&limit=20
```

### 3. Adicionar Mensagem

```http
POST /api/conversations/5/messages
Content-Type: application/json
```

**Body:**
```json
{
  "content": "Quantos pedidos tivemos este mês?",
  "type": "user"
}
```

---

## 📊 Códigos de Status

| Código | Significado | Descrição |
|--------|-------------|-----------|
| 200 | OK | Sucesso |
| 201 | Created | Recurso criado |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token inválido/ausente |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro interno |

---

## 🚀 Exemplos de Uso

### Fluxo Completo: Upload → Query → Favorito

```javascript
// 1. Upload de arquivo CSV
const formData = new FormData();
formData.append('file', csvFile);
formData.append('name', 'Vendas 2024');

const uploadResponse = await fetch('/api/associated-databases/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});

const { data: database } = await uploadResponse.json();

// 2. Fazer query em linguagem natural
const queryResponse = await fetch('/api/ai/nl2sql', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "Qual o total de vendas por mês?",
    databaseId: database.databaseId,
    schema: database.schema
  })
});

const { data: query } = await queryResponse.json();

// 3. Adicionar aos favoritos
const favoriteResponse = await fetch(`/api/ai/favorites/${query.interactionId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Gerenciamento de Favoritos

```javascript
// Listar favoritos com filtros
const favorites = await fetch('/api/ai/favorites?interactionType=nl2sql&sortBy=created_at', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// Remover múltiplos favoritos
await fetch('/api/ai/favorites', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    interactionIds: [123, 124, 125]
  })
});

// Ver estatísticas
const stats = await fetch('/api/ai/favorites/stats', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

---

## ⚡ Rate Limiting

- **Limite geral**: 100 requests por minuto por usuário
- **Upload de arquivos**: 5 uploads por minuto
- **Queries de IA**: 30 requests por minuto
- **Favoritos**: 60 requests por minuto

Headers de resposta incluem:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640995200
```

---

## 🔧 Configuração e Variáveis de Ambiente

```env
# Base de dados
DATABASE_URL="postgresql://user:pass@localhost:5432/smartbi"

# JWT
JWT_SECRET="seu_jwt_secret_super_seguro"
JWT_EXPIRES_IN="24h"

# APIs de IA
OPENROUTER_API_KEY="sua_chave_openrouter"
GEMINI_API_KEY="sua_chave_gemini"

# Upload
MAX_FILE_SIZE="50MB"
UPLOAD_PATH="./uploads"

# Rate Limiting
RATE_LIMIT_WINDOW="1m"
RATE_LIMIT_MAX="100"
```

---

## 🛡️ Segurança

- **Autenticação JWT** obrigatória
- **Validação de entrada** em todos os endpoints
- **Sanitização de SQL** para prevenir injection
- **Rate limiting** por usuário
- **Validação de tipos de arquivo** no upload
- **Conexões de BD** com credenciais criptografadas

---

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@smartbi.com
- 📖 Documentação: https://docs.smartbi.com
- 🐛 Issues: https://github.com/empresa/smartbi/issues

**Versão da API**: v1.0.0
**Última atualização**: Janeiro 2024
