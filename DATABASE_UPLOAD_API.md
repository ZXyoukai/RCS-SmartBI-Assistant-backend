# 📊 API de Bancos de Dados Associados - Funcionalidades Estendidas

## 🚀 **Novas Funcionalidades Implementadas**

### **1. Upload de Arquivos**
Permite upload de diferentes tipos de arquivo com extração automática de schema.

#### **POST** `/api/associated-databases/upload`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**: FormData com:
  - `file`: Arquivo (CSV, Excel, SQL, JSON)
  - `name`: Nome opcional para o banco
  - `description`: Descrição opcional

**Tipos Suportados:**
- ✅ **CSV** (`.csv`) - Detecção automática de tipos de dados
- ✅ **Excel** (`.xlsx`, `.xls`) - Suporte a múltiplas planilhas
- ✅ **SQL** (`.sql`) - Extração de schema de CREATE TABLE
- ✅ **JSON** (`.json`) - Array de objetos ou schema direto

**Exemplo de resposta:**
```json
{
  "success": true,
  "message": "Arquivo CSV processado com sucesso",
  "data": {
    "database": {
      "id": 123,
      "name": "vendas_2024",
      "type": "CSV",
      "schema": "...",
      "description": "Dados importados de CSV: vendas.csv"
    },
    "processInfo": {
      "type": "CSV",
      "totalRows": 1500,
      "schema": {...},
      "sampleData": [...]
    }
  }
}
```

---

### **2. Teste de Conexão**
Testa conectividade com bancos de dados antes de adicionar.

#### **POST** `/api/associated-databases/test-connection`
- **Body**:
```json
{
  "type": "PostgreSQL|MySQL|SQLite",
  "url": "connection_string"
}
```

**Exemplos de Connection String:**
- **PostgreSQL**: `postgresql://user:pass@host:5432/database`
- **MySQL**: `mysql://user:pass@host:3306/database`
- **SQLite**: `/path/to/database.db`

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Conexão PostgreSQL bem-sucedida",
  "info": {
    "database": "meu_banco",
    "version": "15.3"
  }
}
```

---

### **3. Conexão e Extração de Schema**
Conecta ao banco e extrai schema automaticamente.

#### **POST** `/api/associated-databases/connect-database`
- **Body**:
```json
{
  "name": "Banco de Produção",
  "type": "PostgreSQL",
  "url": "postgresql://user:pass@host:5432/database",
  "description": "Banco principal do sistema"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Banco PostgreSQL conectado e schema extraído com sucesso",
  "data": {
    "database": {...},
    "connectionInfo": {
      "database": "production",
      "version": "15.3"
    },
    "schema": {
      "users": {
        "columns": {
          "id": {"type": "integer", "primaryKey": true},
          "name": {"type": "text", "nullable": false},
          "email": {"type": "text", "nullable": false}
        }
      }
    },
    "tablesCount": 15
  }
}
```

---

### **4. Preview de Dados**
Visualiza dados de exemplo dos bancos/arquivos.

#### **GET** `/api/associated-databases/preview/:id`
- **Query Params**:
  - `table`: Nome da tabela (opcional)
  - `limit`: Número de registros (padrão: 10)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "database": {
      "id": 123,
      "name": "vendas_2024",
      "type": "CSV"
    },
    "schema": {...},
    "preview": {
      "vendas": [
        {"produto": "Notebook", "valor": 2500, "data": "2024-01-15"},
        {"produto": "Mouse", "valor": 50, "data": "2024-01-15"}
      ]
    },
    "tables": ["vendas"]
  }
}
```

---

### **5. Tipos Suportados**
Lista todos os tipos de banco e arquivo suportados.

#### **GET** `/api/associated-databases/info/supported-types`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "databases": [
      {
        "type": "PostgreSQL",
        "description": "Banco PostgreSQL",
        "connectionExample": "postgresql://user:password@host:port/database",
        "features": ["Schema extraction", "Query execution"]
      }
    ],
    "files": [
      {
        "type": "CSV",
        "description": "Arquivo CSV",
        "extensions": [".csv"],
        "maxSize": "50MB",
        "features": ["Auto schema detection", "Sample data preview"]
      }
    ]
  }
}
```

---

## 🔧 **Funcionalidades por Tipo**

### **📊 Arquivos CSV/Excel**
- ✨ Detecção automática de tipos (integer, numeric, text, date, boolean)
- ✨ Amostra de até 100 registros para preview
- ✨ Suporte a múltiplas planilhas (Excel)
- ✨ Validação de estrutura

### **🗄️ Bancos PostgreSQL/MySQL**
- ✨ Teste de conectividade
- ✨ Extração completa de schema
- ✨ Informações de versão e database
- ✨ Detecção de chaves primárias e constraints

### **📁 Arquivos SQLite**
- ✨ Conexão com arquivo local
- ✨ Extração de schema completo
- ✨ Suporte a PRAGMA para metadados

### **📄 Arquivos SQL**
- ✨ Parse de CREATE TABLE statements
- ✨ Extração de tipos de dados
- ✨ Detecção de constraints

---

## 🛡️ **Segurança e Validações**

- ✅ **Autenticação**: Todas as rotas protegidas por JWT
- ✅ **Autorização**: Apenas admins podem criar/modificar
- ✅ **Upload Seguro**: Validação de tipos de arquivo
- ✅ **Tamanho Limite**: 50MB máximo por arquivo
- ✅ **Conexão Timeout**: 10 segundos para testes de conexão
- ✅ **SSL Support**: Conexões seguras para bancos remotos

---

## 📈 **Benefícios**

🎯 **UX Melhorada**: Interface mais amigável para configuração
🚀 **Automação**: Extração automática de schemas
🔗 **Flexibilidade**: Suporte a múltiplas fontes de dados
📊 **Preview**: Visualização antes da configuração final
🛠️ **Debugging**: Teste de conexão independente

---

## 🔄 **Fluxo de Uso**

### **Para Arquivos:**
1. **Upload** → Processamento automático → Schema extraído → Banco criado

### **Para Bancos:**
1. **Teste** → Conexão validada → **Conectar** → Schema extraído → Banco criado

### **Manual:**
1. **Criar** com schema manual → Validação → Banco criado

Todas as funcionalidades estão integradas e funcionais! 🎉
