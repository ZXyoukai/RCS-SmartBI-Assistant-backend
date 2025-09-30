# ML Pipeline API - Machine Learning com FastAPI

Esta é uma API REST completa para upload e análise de dados usando Machine Learning. O sistema processa arquivos CSV ou SQL e retorna análises completas com insights automáticos.

## 🚀 Funcionalidades

- **Upload de Arquivos**: CSV ou SQL dumps via API REST
- **Pipeline ML Completo**: Pré-processamento, treinamento e avaliação
- **Múltiplos Modelos**: RandomForest, SVM e Logistic Regression
- **Análise Automática**: Insights em linguagem natural
- **Visualizações**: Matriz de confusão e gráficos de métricas
- **Suporte SQL**: Processamento de dumps SQLite

## 📁 Estrutura do Projeto

```
BI.AI/
├── main.py                    # API FastAPI
├── ml_pipeline.py             # Pipeline ML Universal
├── analysis.py                # Gerador de insights automáticos
├── requirements.txt           # Dependências (inclui drivers SQL)
├── outputs/                   # Gráficos e visualizações gerados
├── temp/                      # Arquivos temporários
├── dados.csv                  # Dataset de exemplo (Iris)
├── exemplo_simples.sql        # SQL básico SQLite
├── exemplo_mysql.sql          # SQL MySQL/MariaDB
├── exemplo_postgresql.sql     # SQL PostgreSQL
├── exemplo_misto.sql          # SQL misto (vários dialetos)
└── README.md                  # Este arquivo
```

## 🛠️ Como Usar

### 1. Instalação
```bash
py -m pip install -r requirements.txt
```

### 2. Iniciar a API
```bash
python main.py
```

A API estará disponível em: http://localhost:8000

### 3. Documentação Interativa
Acesse: http://localhost:8000/docs

### 4. Endpoints Principais

#### POST /upload
Upload de arquivo CSV ou SQL para análise ML
- **Content-Type**: multipart/form-data
- **Parâmetro**: file (arquivo CSV ou SQL)
- **Retorno**: JSON com métricas, insights e caminhos dos gráficos

#### GET /outputs/{filename}
Acesso aos gráficos gerados (matriz de confusão, métricas)

#### GET /health
Status da API e verificação de saúde

## 📊 Exemplo de Uso

### Upload via cURL:
```bash
curl -X POST "http://localhost:8000/upload" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@dados.csv"
```

### Resposta da API:
```json
{
  "file_info": {
    "filename": "dados.csv",
    "file_type": "csv",
    "size_bytes": 2928
  },
  "pipeline_results": {
    "success": true,
    "data_info": {
      "rows": 150,
      "columns": 5,
      "features": 4,
      "target_classes": 3
    },
    "results": {
      "RandomForest": {
        "accuracy": 0.9333,
        "precision": 0.9333,
        "recall": 0.9333,
        "f1": 0.9333,
        "roc_auc": 0.9867
      }
    },
    "plots": [
      "outputs/confusion_matrix_RandomForest_20250929_205230.png",
      "outputs/metrics_RandomForest_20250929_205230.png"
    ]
  },
  "analysis": {
    "executive_summary": [
      "📋 3/3 modelos treinados com sucesso",
      "📊 Dataset: 150 linhas, 4 features",
      "🎯 3 classes para predição"
    ],
    "model_insights": {
      "RandomForest": "✅ Excelente acurácia (93.3%) | ✅ Excelente precisão | ✅ Excelente recall"
    },
    "recommendations": [
      "✅ Modelos com boa performance - considere deploy em produção"
    ]
  }
}
```

## 📝 Formatos Suportados

### CSV
- Última coluna deve ser o target/classe
- Colunas numéricas são automaticamente detectadas
- Valores nulos são tratados automaticamente

### SQL Universal 🆕
- **MySQL/MariaDB**: AUTO_INCREMENT, ENGINE, CHARSET, tipos específicos
- **PostgreSQL**: SERIAL, BOOLEAN, ARRAY, tipos específicos  
- **SQLite**: Sintaxe nativa
- **SQL Server**: Tipos básicos (IDENTITY, NVARCHAR)
- **SQL Misto**: Combina sintaxes de diferentes SGBDs

#### Recursos SQL Avançados:
- ✅ **Detecção automática** do dialeto SQL
- ✅ **Conversão universal** para SQLite
- ✅ **Limpeza de comentários** (-- # /* */)
- ✅ **Normalização de tipos** de dados
- ✅ **Processamento robusto** de statements
- ✅ **Seleção inteligente** da melhor tabela

## 🔧 Arquivos de Exemplo

### Dados CSV
- **dados.csv**: Dataset Iris (classificação multiclasse)

### Dumps SQL Universais 🆕
- **exemplo_simples.sql**: SQLite básico (dataset Iris)
- **exemplo_mysql.sql**: MySQL/MariaDB com AUTO_INCREMENT, ENGINE, CHARSET
- **exemplo_postgresql.sql**: PostgreSQL com SERIAL, BOOLEAN, ARRAY
- **exemplo_misto.sql**: SQL complexo misturando sintaxes (análise de vendas)

### Teste Todos os Formatos:
```bash
# CSV tradicional
curl -F "file=@dados.csv" http://localhost:8000/upload

# SQLite simples  
curl -F "file=@exemplo_simples.sql" http://localhost:8000/upload

# MySQL/MariaDB
curl -F "file=@exemplo_mysql.sql" http://localhost:8000/upload

# PostgreSQL
curl -F "file=@exemplo_postgresql.sql" http://localhost:8000/upload

# SQL Misto (complexo)
curl -F "file=@exemplo_misto.sql" http://localhost:8000/upload
```

## 🚀 Melhorias Futuras

- Suporte a outros formatos (Excel, JSON)
- Parâmetros customizáveis para modelos
- Dashboard web para visualização
- Armazenamento de histórico de análises
- Deploy em contêineres Docker

---

> 🤖 **API pronta para produção!** Upload seus dados e obtenha insights instantâneos.
