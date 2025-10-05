# Migração de Mermaid para Chart.js - Documentação

## 📊 Visão Geral das Mudanças

O sistema foi migrado de gerar visualizações Mermaid para Chart.js, oferecendo maior flexibilidade e interatividade para o frontend. Esta mudança permite gráficos dinâmicos, responsivos e com melhor performance.

---

## 🔄 Principais Alterações

### 1. **Novo Serviço Chart.js** (`chartjsVisualizationService.js`)

**Funcionalidades:**
- ✅ Análise automática de tipos de dados
- ✅ Detecção inteligente do melhor tipo de gráfico
- ✅ Suporte para 6+ tipos de gráficos
- ✅ Geração de cores automática
- ✅ Estatísticas de dados
- ✅ Configurações personalizáveis

**Tipos de gráficos suportados:**
- `bar` - Gráfico de barras
- `line` - Gráfico de linha (séries temporais)
- `pie` - Gráfico de pizza
- `doughnut` - Gráfico rosquinha
- `scatter` - Gráfico de dispersão
- `radar` - Gráfico radar (multi-dimensional)

### 2. **Controller Atualizado** (`aiController.js`)

**Mudanças:**
- ❌ Removido: `MermaidVisualizationService`
- ✅ Adicionado: `ChartJSVisualizationService`
- ❌ Removido: Chamadas para OpenRouter para gerar Mermaid
- ✅ Atualizado: Responses com configurações Chart.js

### 3. **Rotas Atualizadas** (`aiRoutes.js`)

**Antes:**
```javascript
POST /api/ai/generate-mermaid
```

**Agora:**
```javascript
POST /api/ai/generate-chart
```

---

## 🚀 Como Usar

### 1. **Endpoint Principal - NL2SQL com Chart.js**

```http
POST /api/ai/nl2sql
```

**Resposta agora inclui:**
```json
{
  "success": true,
  "data": {
    "sql": "SELECT * FROM users;",
    "explanation": "Consulta para obter todos os usuários",
    "chartConfig": {
      "type": "bar",
      "data": {
        "labels": ["Admin", "User", "Guest"],
        "datasets": [{
          "label": "Count",
          "data": [5, 15, 3],
          "backgroundColor": ["rgba(255, 99, 132, 0.8)", ...]
        }]
      },
      "options": {
        "responsive": true,
        "plugins": {
          "title": {
            "display": true,
            "text": "User Distribution"
          }
        }
      }
    },
    "visualContent": {
      "success": true,
      "chartConfig": { ... },
      "visualizationType": "bar",
      "chartTitle": "User Distribution",
      "dataStats": { ... }
    }
  }
}
```

### 2. **Endpoint Específico para Gráficos**

```http
POST /api/ai/generate-chart
Content-Type: application/json
```

**Body:**
```json
{
  "queryData": {
    "columns": ["name", "age", "department"],
    "rows": [
      {"name": "João", "age": 30, "department": "TI"},
      {"name": "Maria", "age": 25, "department": "RH"}
    ]
  },
  "chartType": "pie",
  "title": "Distribuição por Departamento",
  "options": {
    "plugins": {
      "legend": {
        "position": "bottom"
      }
    }
  }
}
```

---

## 🎯 Detecção Automática de Tipos

O sistema analisa automaticamente os dados e escolhe o gráfico mais adequado:

### **Regras de Detecção:**

1. **Data + Numérico** → `line` (série temporal)
2. **1 Categórico + 1 Numérico (≤6 categorias)** → `pie`
3. **1 Categórico + 1 Numérico (>6 categorias)** → `bar`
4. **2 Numéricos** → `scatter`
5. **Múltiplos categóricos + numéricos** → `radar` ou `bar`
6. **Sem dados numéricos** → `bar` (contagem)

### **Análise de Tipos de Dados:**

```javascript
{
  "numeric": ["age", "salary", "score"],      // Dados numéricos
  "categorical": ["department", "status"],     // Poucos valores únicos
  "date": ["created_at", "birth_date"],       // Datas válidas  
  "text": ["description", "notes"]             // Texto livre
}
```

---

## 🎨 Personalização de Gráficos

### **Cores Automáticas:**
- Paleta de 10 cores predefinidas
- Rotação automática para múltiplos datasets
- Transparência para preenchimentos

### **Configurações Padrão:**
```javascript
{
  responsive: true,
  plugins: {
    title: { display: true, text: "Auto-generated" },
    legend: { position: "right" }
  },
  scales: {
    y: { beginAtZero: true }
  }
}
```

### **Personalizações Suportadas:**
- Tipo de gráfico específico
- Título personalizado
- Opções avançadas do Chart.js
- Cores customizadas
- Posicionamento de elementos

---

## 📈 Estatísticas e Metadados

Cada resposta inclui estatísticas detalhadas:

```json
{
  "dataStats": {
    "totalRows": 150,
    "totalColumns": 4,
    "columnTypes": {
      "age": "numeric",
      "department": "categorical"
    },
    "dataQuality": {
      "age": {
        "completeness": 0.96,
        "uniqueValues": 45,
        "min": 18,
        "max": 65,
        "avg": 34.2
      }
    }
  },
  "metadata": {
    "totalDataPoints": 150,
    "columnsCount": 4,
    "chartType": "bar",
    "hasTimeSeries": false,
    "hasNumericData": true
  }
}
```

---

## 🔧 Implementação no Frontend

### **Uso com Chart.js:**

```javascript
// Recebe a resposta da API
const response = await fetch('/api/ai/nl2sql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "Mostre vendas por mês" })
});

const { data } = await response.json();

// Usa diretamente no Chart.js
if (data.chartConfig) {
  const ctx = document.getElementById('myChart').getContext('2d');
  new Chart(ctx, data.chartConfig);
}
```

### **Customização Adicional:**

```javascript
// Modifica configuração antes de renderizar
const chartConfig = data.chartConfig;
chartConfig.options.animation = { duration: 2000 };
chartConfig.options.plugins.legend.position = 'bottom';

new Chart(ctx, chartConfig);
```

---

## 🛠️ Tratamento de Erros

### **Dados Vazios:**
```json
{
  "chartConfig": {
    "type": "bar",
    "data": {
      "labels": ["No Data"],
      "datasets": [{
        "label": "No data available",
        "data": [0],
        "backgroundColor": "rgba(201, 203, 207, 0.6)"
      }]
    }
  }
}
```

### **Erros de Execução:**
```json
{
  "chartConfig": {
    "type": "bar",
    "data": {
      "labels": ["Execution Error"],
      "datasets": [{
        "label": "Error Status",
        "data": [1],
        "backgroundColor": "rgba(255, 99, 132, 0.6)"
      }]
    }
  },
  "errorMessage": "Table 'users' doesn't exist",
  "aiCorrected": false
}
```

---

## ⚡ Vantagens da Migração

### **Performance:**
- ❌ Mermaid: Rendering server-side + parsing client-side
- ✅ Chart.js: Rendering direto no client com Canvas/WebGL

### **Interatividade:**
- ❌ Mermaid: Visualizações estáticas
- ✅ Chart.js: Hover, zoom, pan, animações, tooltips

### **Responsividade:**
- ❌ Mermaid: Ajustes manuais para diferentes telas
- ✅ Chart.js: Responsivo por padrão

### **Customização:**
- ❌ Mermaid: Limitado pela sintaxe do Mermaid
- ✅ Chart.js: Configurações ilimitadas e plugins

### **Manutenção:**
- ❌ Mermaid: Geração via AI + correções de sintaxe
- ✅ Chart.js: Geração determinística + configurações previsíveis

---

## 🔍 Exemplos de Uso

### **Vendas por Mês (Line Chart):**
```json
{
  "queryData": {
    "columns": ["month", "sales"],
    "rows": [
      {"month": "2024-01", "sales": 15000},
      {"month": "2024-02", "sales": 18000}
    ]
  }
}
```
→ **Resultado:** Gráfico de linha com série temporal

### **Distribuição de Usuários (Pie Chart):**
```json
{
  "queryData": {
    "columns": ["role", "count"],
    "rows": [
      {"role": "Admin", "count": 5},
      {"role": "User", "count": 50}
    ]
  }
}
```
→ **Resultado:** Gráfico de pizza

### **Análise Multi-dimensional (Radar Chart):**
```json
{
  "queryData": {
    "columns": ["team", "productivity", "quality", "speed"],
    "rows": [
      {"team": "Frontend", "productivity": 8, "quality": 9, "speed": 7},
      {"team": "Backend", "productivity": 9, "quality": 8, "speed": 9}
    ]
  }
}
```
→ **Resultado:** Gráfico radar comparativo

---

## 🚦 Status da Migração

- ✅ **Serviço Chart.js** - Implementado
- ✅ **Controller atualizado** - Implementado  
- ✅ **Rotas atualizadas** - Implementado
- ✅ **Auto-correção SQL mantida** - Implementado
- ✅ **Sistema de favoritos** - Mantido
- ✅ **Upload de arquivos** - Mantido
- ✅ **Conexões de BD** - Mantido

### **Compatibilidade:**
- ❌ **Endpoints antigos Mermaid** - Removidos
- ✅ **Estrutura de resposta** - Mantida (com adições)
- ✅ **Autenticação** - Mantida
- ✅ **Rate limiting** - Mantido

---

## 📋 Próximos Passos

1. **Frontend:** Atualizar para usar Chart.js
2. **Testes:** Validar todos os tipos de gráficos
3. **Performance:** Otimizar geração para datasets grandes
4. **Features:** Adicionar mais tipos de gráficos se necessário

---

**Data da Migração:** Outubro 2025
**Status:** ✅ Completa
**Responsável:** Sistema de IA
