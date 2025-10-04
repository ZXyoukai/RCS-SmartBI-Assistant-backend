const AIService = require('./aiService');
const FallbackService = require('./fallbackService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NL2SQLService extends AIService {
  constructor() {
    super();
    this.databaseSchema = this.loadDatabaseSchema();
    this.fallbackService = new FallbackService();
  }

  /**
   * Carrega o schema do banco de dados para contexto
   * @returns {string} Schema formatado
   */
  loadDatabaseSchema() {
    return `
    Esquema do Banco de Dados:
    
    TABELA: users
    - id (INT, PRIMARY KEY)
    - name (STRING)
    - email (STRING, UNIQUE)
    - password_hash (STRING)
    - role (STRING)
    - created_at (DATETIME)
    
    TABELA: queries
    - id (INT, PRIMARY KEY)
    - user_id (INT, FOREIGN KEY -> users.id)
    - question_text (STRING)
    - created_at (DATETIME)
    
    TABELA: results
    - id (INT, PRIMARY KEY)
    - query_id (INT, FOREIGN KEY -> queries.id)
    - result_type (STRING)
    - content (JSON)
    - created_at (DATETIME)
    
    TABELA: history
    - id (INT, PRIMARY KEY)
    - user_id (INT, FOREIGN KEY -> users.id)
    - query_id (INT, FOREIGN KEY -> queries.id)
    - success (BOOLEAN)
    - execution_time (FLOAT)
    - created_at (DATETIME)
    
    TABELA: ai_interactions
    - id (INT, PRIMARY KEY)
    - session_id (INT)
    - user_id (INT, FOREIGN KEY -> users.id)
    - interaction_type (STRING)
    - input_text (STRING)
    - processed_query (STRING)
    - ai_response (JSON)
    - execution_status (STRING)
    - confidence_score (FLOAT)
    - created_at (DATETIME)
    `;
  }

  /**
   * Converte linguagem natural para SQL
   * @param {string} naturalLanguageQuery - Consulta em linguagem natural
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @returns {Object} Resultado da conversão
  */


  async convertNLToSQL(naturalLanguageQuery, userId, sessionId, dbSchema, type,) {
    try {
      // Verifica cache primeiro
      const cached = await this.getCachedResponse(naturalLanguageQuery, 'nl2sql');
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }

      // Constrói contexto da conversa
      const conversationContext = await this.buildConversationContext(sessionId);

      // Cria prompt específico para NL-to-SQL
      const prompt = this.buildNL2SQLPrompt(naturalLanguageQuery, dbSchema, type, conversationContext);

      // Chama IA
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'nl2sql',
        userId,
        sessionId
      });

      if (!aiResponse.success) {
        return this.handleNL2SQLError(aiResponse, naturalLanguageQuery, userId, sessionId);
      }

      // Processa resposta
      const sqlData = this.parseNL2SQLResponse(aiResponse.response);
      const confidenceScore = this.calculateNL2SQLConfidence(sqlData, naturalLanguageQuery);

      const result = {
        success: true,
        sql: sqlData.sql,
        explanation: sqlData.explanation,
        confidence: confidenceScore,
        executionTime: aiResponse.executionTime,
        needsFallback: this.needsFallback(aiResponse, confidenceScore),
        metadata: aiResponse.metadata
      };

      // Salva no cache se confiança for alta
      if (confidenceScore > 0.7) {
        await this.cacheResponse(naturalLanguageQuery, 'nl2sql', result);
      }

      return result;

    } catch (error) {
      console.error('Erro na conversão NL-to-SQL:', error);
      return this.handleNL2SQLError({ error: error.message }, naturalLanguageQuery, userId, sessionId);
    }
  }

  /**
   * Converte SQL para linguagem natural
   * @param {string} sqlQuery - Consulta SQL
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @returns {Object} Resultado da conversão
  */
  async convertSQLToNL(sqlQuery, userId, sessionId) {
    try {
      // Verifica cache
      const cached = await this.getCachedResponse(sqlQuery, 'sql2nl');
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }

      const prompt = this.buildSQL2NLPrompt(sqlQuery);
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'sql2nl',
        userId,
        sessionId
      });

      if (!aiResponse.success) {
        return this.handleSQL2NLError(aiResponse, sqlQuery, userId, sessionId);
      }

      const explanation = this.parseSQL2NLResponse(aiResponse.response);
      const confidenceScore = this.calculateSQL2NLConfidence(explanation, sqlQuery);

      const result = {
        success: true,
        explanation,
        confidence: confidenceScore,
        executionTime: aiResponse.executionTime,
        metadata: aiResponse.metadata
      };

      // Cache se confiança for alta
      if (confidenceScore > 0.7) {
        await this.cacheResponse(sqlQuery, 'sql2nl', result);
      }

      return result;

    } catch (error) {
      console.error('Erro na conversão SQL-to-NL:', error);
      return this.handleSQL2NLError({ error: error.message }, sqlQuery, userId, sessionId);
    }
  }
  /**
   * Gera conteúdo visual em markdown baseado nos dados
   * @param {Object} queryData - Dados da consulta executada
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @param {Object} dbSchema - Schema do banco de dados
   * @param {string} dbType - Tipo do banco de dados
   * @returns {Object} Resultado com markdown gerado
   */
  async generateVisualContent(queryData, userId, sessionId, dbSchema, dbType) {
    try {
      // Verifica se há dados válidos para processar
      if (!queryData || queryData.error) {
        return {
          success: false,
          markdown: this.generateErrorMarkdown(queryData?.error || 'Nenhum dado disponível para visualização'),
          executionTime: 0
        };
      }

      // Verifica cache primeiro
      const cacheKey = this.generateContentCacheKey(queryData, dbSchema);
      const cached = await this.getCachedResponse(cacheKey, 'generateVisualContent');
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }

      // Determina o melhor tipo de visualização baseado nos dados
      const visualizationType = this.determineVisualizationType(queryData);
      
      // Cria prompt otimizado
      const prompt = this.buildMarkdownPrompt(queryData, dbSchema, dbType, visualizationType);

      // Chama IA com configurações específicas para markdown
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'generateVisualContent',
        userId,
        sessionId,
        temperature: 0.3, // Menor temperatura para mais consistência
        maxTokens: 2000
      });

      if (!aiResponse.success) {
        return this.handleMarkdownError(aiResponse, queryData, userId, sessionId);
      }

      // Processa e valida o markdown gerado
      const processedMarkdown = this.processMarkdownResponse(aiResponse.response);
      
      const result = {
        success: true,
        markdown: processedMarkdown,
        visualizationType,
        dataStats: this.generateDataStats(queryData),
        executionTime: aiResponse.executionTime
      };

      // Cache apenas se a resposta for de qualidade
      if (this.isHighQualityMarkdown(processedMarkdown)) {
        await this.cacheResponse(cacheKey, 'generateVisualContent', result);
      }

      return result;

    } catch (error) {
      console.error('Erro na geração de conteúdo visual:', error);
      return this.handleMarkdownError({ error: error.message }, queryData, userId, sessionId);
    }
  }

  /**
   * Converte SQL para linguagem natural
   * @param {string} sqlQuery - Consulta SQL
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @returns {Object} Resultado da conversão
   */

  /**
   * Gera chave de cache para conteúdo visual
   * @param {Object} queryData - Dados da consulta
   * @param {Object} dbSchema - Schema do banco
   * @returns {string} Chave de cache
   */
  generateContentCacheKey(queryData, dbSchema) {
    const dataKey = JSON.stringify({
      columns: queryData?.columns || [],
      rowCount: queryData?.rows?.length || 0,
      dataTypes: this.analyzeDataTypes(queryData)
    });
    const schemaKey = JSON.stringify(dbSchema).slice(0, 100);
    return `${dataKey}-${schemaKey}`;
  }

  /**
   * Analisa tipos de dados na consulta
   * @param {Object} queryData - Dados da consulta
   * @returns {Object} Análise dos tipos de dados
   */
  analyzeDataTypes(queryData) {
    if (!queryData?.rows || queryData.rows.length === 0) {
      return {};
    }

    const columns = queryData.columns || Object.keys(queryData.rows[0]);
    const typeAnalysis = {};

    columns.forEach(column => {
      const values = queryData.rows.map(row => row[column]).filter(v => v !== null && v !== undefined);
      if (values.length === 0) {
        typeAnalysis[column] = 'unknown';
        return;
      }

      const firstValue = values[0];
      if (typeof firstValue === 'number') {
        typeAnalysis[column] = 'numeric';
      } else if (firstValue instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(firstValue)) {
        typeAnalysis[column] = 'date';
      } else if (typeof firstValue === 'boolean') {
        typeAnalysis[column] = 'boolean';
      } else {
        // Verifica se é categórico (poucos valores únicos)
        const uniqueValues = [...new Set(values)];
        typeAnalysis[column] = uniqueValues.length <= Math.max(5, values.length * 0.1) ? 'categorical' : 'text';
      }
    });

    return typeAnalysis;
  }

  /**
   * Determina o melhor tipo de visualização
   * @param {Object} queryData - Dados da consulta
   * @returns {string} Tipo de visualização
   */
  determineVisualizationType(queryData) {
    if (!queryData?.rows || queryData.rows.length === 0) {
      return 'table';
    }

    const dataTypes = this.analyzeDataTypes(queryData);
    const columns = queryData.columns || Object.keys(queryData.rows[0]);
    const numericColumns = columns.filter(col => dataTypes[col] === 'numeric');
    const categoricalColumns = columns.filter(col => dataTypes[col] === 'categorical');
    const dateColumns = columns.filter(col => dataTypes[col] === 'date');

    // Lógica de seleção de visualização
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      return 'line_chart'; // Dados temporais
    } else if (categoricalColumns.length === 1 && numericColumns.length === 1) {
      return 'bar_chart'; // Categoria vs valor
    } else if (categoricalColumns.length === 1 && numericColumns.length === 0) {
      return 'pie_chart'; // Distribuição categórica
    } else if (numericColumns.length >= 2) {
      return 'scatter_plot'; // Correlação numérica
    } else {
      return 'table'; // Fallback para tabela
    }
  }

  /**
   * Constrói prompt otimizado para geração de markdown
   * @param {Object} queryData - Dados da consulta
   * @param {Object} dbSchema - Schema do banco
   * @param {string} dbType - Tipo do banco
   * @param {string} visualizationType - Tipo de visualização sugerido
   * @returns {string} Prompt formatado
   */
  buildMarkdownPrompt(queryData, dbSchema, dbType, visualizationType) {
    const dataStats = this.generateDataStats(queryData);
    
    return `Você é um especialista em análise de dados e visualização que gera markdown estruturado.

**DADOS PARA ANÁLISE:**
- Colunas: ${queryData.columns?.join(', ') || 'N/A'}
- Total de registros: ${queryData.rows?.length || 0}
- Tipos de dados detectados: ${JSON.stringify(this.analyzeDataTypes(queryData))}
- Visualização sugerida: ${visualizationType}

**AMOSTRA DOS DADOS (primeiras 5 linhas):**
\`\`\`json
${JSON.stringify(queryData.rows?.slice(0, 5) || [], null, 2)}
\`\`\`

**ESTATÍSTICAS:**
${JSON.stringify(dataStats, null, 2)}

**INSTRUÇÕES:**
1. Gere um markdown completo e bem estruturado
2. Inclua um título descritivo baseado nos dados
3. Adicione uma seção de resumo executivo
4. Se apropriado, use Mermaid para gráficos (bar, line, pie)
5. Inclua insights e padrões identificados
6. Adicione tabelas formatadas quando necessário
7. Use formatação markdown adequada (negrito, itálico, listas)

**TIPOS DE MERMAID DISPONÍVEIS:**
- Bar Chart: para comparações categóricas
- Line Chart: para dados temporais
- Pie Chart: para distribuições
- Flowchart: para processos
- Quadrant Chart: para análise de quadrantes

**FORMATO DE RESPOSTA:**
Retorne APENAS o markdown, sem explicações adicionais.

**EXEMPLO DE ESTRUTURA:**
\`\`\`markdown
# Análise de [Título dos Dados]

## 📊 Resumo Executivo
[Principais insights em 2-3 frases]

## 📈 Visualização Principal
[Gráfico Mermaid se apropriado]

## 📋 Dados Detalhados
[Tabela formatada]

## 🔍 Insights Identificados
- [Insight 1]
- [Insight 2]

## 📌 Conclusões
[Resumo das principais descobertas]
\`\`\``;
  }

  /**
   * Gera estatísticas dos dados
   * @param {Object} queryData - Dados da consulta
   * @returns {Object} Estatísticas
   */
  generateDataStats(queryData) {
    if (!queryData?.rows || queryData.rows.length === 0) {
      return { totalRows: 0, columns: 0 };
    }

    const dataTypes = this.analyzeDataTypes(queryData);
    const columns = queryData.columns || Object.keys(queryData.rows[0]);
    
    const stats = {
      totalRows: queryData.rows.length,
      totalColumns: columns.length,
      dataTypes: dataTypes,
      completeness: {}
    };

    // Calcula completude por coluna
    columns.forEach(column => {
      const nonNullValues = queryData.rows.filter(row => 
        row[column] !== null && row[column] !== undefined && row[column] !== ''
      ).length;
      stats.completeness[column] = Math.round((nonNullValues / queryData.rows.length) * 100);
    });

    return stats;
  }

  /**
   * Processa a resposta de markdown da IA
   * @param {string} response - Resposta bruta da IA
   * @returns {string} Markdown processado
   */
  processMarkdownResponse(response) {
    if (!response) {
      return this.generateErrorMarkdown('Resposta vazia da IA');
    }

    // Remove possíveis marcadores de código
    let cleaned = response.replace(/```markdown\n?/g, '').replace(/```\n?$/g, '');
    
    // Valida estrutura básica do markdown
    if (!cleaned.includes('#') && !cleaned.includes('*') && !cleaned.includes('-')) {
      // Se não parece markdown, envolve em estrutura básica
      cleaned = `# Análise dos Dados\n\n${cleaned}`;
    }

    return cleaned.trim();
  }

  /**
   * Gera markdown de erro
   * @param {string} errorMessage - Mensagem de erro
   * @returns {string} Markdown de erro
   */
  generateErrorMarkdown(errorMessage) {
    return `# ⚠️ Erro na Visualização

## Problema Identificado
${errorMessage}

## Sugestões
- Verifique se a consulta SQL retornou dados válidos
- Tente reformular a pergunta
- Verifique a conexão com o banco de dados

---
*Para mais ajuda, entre em contato com o suporte.*`;
  }

  /**
   * Verifica se o markdown gerado é de alta qualidade
   * @param {string} markdown - Markdown para verificar
   * @returns {boolean} True se for de alta qualidade
   */
  isHighQualityMarkdown(markdown) {
    if (!markdown || markdown.length < 100) return false;
    
    const qualityChecks = [
      markdown.includes('#'),      // Tem títulos
      markdown.includes('*'),      // Tem formatação
      markdown.includes('|'),      // Tem tabelas OU
      markdown.includes('```'),    // Tem código/gráficos
      markdown.split('\n').length > 5  // Tem estrutura
    ];

    return qualityChecks.filter(Boolean).length >= 3;
  }

  /**
   * Trata erros na geração de markdown
   * @param {Object} aiResponse - Resposta com erro
   * @param {Object} queryData - Dados da consulta original
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @returns {Object} Resposta de erro
   */
  async handleMarkdownError(aiResponse, queryData, userId, sessionId) {
    const errorMarkdown = this.generateErrorMarkdown(
      aiResponse.error || 'Erro desconhecido na geração de conteúdo visual'
    );

    return {
      success: false,
      markdown: errorMarkdown,
      error: aiResponse.error,
      executionTime: 0,
      fallbackUsed: true
    };
  }


  buildNL2SQLPrompt(query, dbSchema, type, conversationContext) {
    return `Tenha em mente que ${conversationContext}
Você é um assistente que converte linguagem natural para SQL usando SOMENTE as tabelas e colunas fornecidas no schema abaixo.
TIPO DE BANCO DE DADOS:
${type}
SCHEMA DO BANCO DE DADOS:
${JSON.stringify(dbSchema, null, 2)}
---
## REGRAS DE GERAÇÃO E MAPEAMENTO (CRÍTICAS)
---
1. Use **apenas** tabelas e colunas que existem no schema.
2. Não invente nomes de tabelas ou colunas (ex: não use "users" se ela não estiver no schema).
3. **CORRESPONDÊNCIA DE NOME É OBRIGATÓRIA**: Se a consulta mencionar conceitos (ex: "usuários", "relatórios", "alertas"), você deve encontrar a tabela mais próxima no schema (ex: "User", "Report", "Alert").
4. **VALIDE O PLURAL/SINGULAR**: A correspondência deve ser **EXATA**. Se a linguagem natural for "usuários", você deve procurar por **User** ou **Users** (ou o que estiver no schema) e usar o nome **idêntico** ao do schema.

Obrigatoriamente siga o seguinte:
1. Somente retorne tabelas e colunas que **existem no schema**.
2. **USE SEMPRE O NOME EXATO (Case Sensitive)** da tabela e coluna conforme definido no SCHEMA (ex: se for 'User', use 'User', nunca 'users').
3. Se não tiver certeza sobre como mapear um termo, **PEÇA ESCLARECIMENTOS** explicitamente.
4. Irás Gerar oque é compativel com ${type}.
5. Depois de gerar o SQL, analisa-o para garantir que está correto e faz sentido e se não, corrija-o.

---
FORMATO DE RESPOSTA (somente JSON):
{
  "sql": "SELECT ... FROM ...",
  "explanation": "Explicação simples do que a consulta faz, em português",
  "confidence": "high" | "medium" | "low"
}
SE NÃO FOR POSSÍVEL CONVERTER:
{
  "sql": null,
  "explanation": "Não foi possível converter esta consulta. Motivo: [explique o porquê]",
  "confidence": "low"
}
CONSULTA EM LINGUAGEM NATURAL:
"${query}"
RESPOSTA:`;
  }

  /**
   * Constrói prompt para SQL-to-NL
   * @param {string} sqlQuery - Consulta SQL
   * @returns {string} Prompt formatado
   */
  buildSQL2NLPrompt(sqlQuery) {
    return `
Você é um especialista em explicar consultas SQL em linguagem natural.

${this.databaseSchema}

INSTRUÇÕES:
1. Explique a consulta SQL em português claro e simples
2. Descreva o que a consulta está fazendo, quais dados está buscando
3. Mantenha a explicação técnica mas acessível

CONSULTA SQL: "${sqlQuery}"

EXPLICAÇÃO EM PORTUGUÊS:`;
  }

  /**
   * Processa resposta NL-to-SQL
   * @param {string} response - Resposta da IA
   * @returns {Object} Dados estruturados
   */
  parseNL2SQLResponse(response) {
    try {
      // Remove possíveis caracteres de formatação
      const cleanResponse = response.trim().replace(/```json|```/g, '');
      const parsed = JSON.parse(cleanResponse);

      return {
        sql: parsed.sql,
        explanation: parsed.explanation || 'SQL gerado com sucesso',
        confidence: parsed.confidence || 'medium'
      };
    } catch (error) {
      // Fallback para parsing manual se JSON falhar
      return this.manualParseNL2SQL(response);
    }
  }

  /**
   * Parse manual para NL-to-SQL quando JSON falha
   * @param {string} response - Resposta da IA
   * @returns {Object} Dados estruturados
   */
  manualParseNL2SQL(response) {
    // Busca por padrões SQL na resposta
    const sqlMatch = response.match(/SELECT[\s\S]*?;?/i);

    return {
      sql: sqlMatch ? sqlMatch[0].trim() : null,
      explanation: 'SQL extraído da resposta da IA',
      confidence: sqlMatch ? 'medium' : 'low'
    };
  }

  /**
   * Processa resposta SQL-to-NL
   * @param {string} response - Resposta da IA
   * @returns {string} Explicação processada
   */
  parseSQL2NLResponse(response) {
    return response.trim();
  }

  /**
   * Calcula confiança para NL-to-SQL
   * @param {Object} sqlData - Dados do SQL
   * @param {string} originalQuery - Consulta original
   * @returns {number} Score de confiança
   */
  calculateNL2SQLConfidence(sqlData, originalQuery) {
    let confidence = 0.5;

    if (sqlData.sql) {
      confidence += 0.2;

      // Verifica estrutura SQL válida
      if (sqlData.sql.toUpperCase().includes('SELECT')) confidence += 0.1;
      if (sqlData.sql.toUpperCase().includes('FROM')) confidence += 0.1;

      // Verifica se menciona tabelas do schema
      const tables = ['users', 'queries', 'results', 'history', 'ai_interactions'];
      const hasValidTable = tables.some(table => sqlData.sql.toLowerCase().includes(table));
      if (hasValidTable) confidence += 0.1;
    }

    if (sqlData.confidence === 'high') confidence += 0.1;
    if (sqlData.confidence === 'low') confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calcula confiança para SQL-to-NL
   * @param {string} explanation - Explicação gerada
   * @param {string} sqlQuery - Consulta SQL original
   * @returns {number} Score de confiança
   */
  calculateSQL2NLConfidence(explanation, sqlQuery) {
    let confidence = 0.6;

    if (explanation.length > 50) confidence += 0.1;
    if (explanation.length > 100) confidence += 0.1;

    // Verifica se a explicação menciona elementos da consulta
    const sqlElements = sqlQuery.match(/\b(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY)\b/gi) || [];
    const mentionsElements = sqlElements.some(element =>
      explanation.toLowerCase().includes(element.toLowerCase())
    );

    if (mentionsElements) confidence += 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Trata erros de NL-to-SQL
   * @param {Object} aiResponse - Resposta com erro
   * @param {string} query - Consulta original
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @returns {Object} Resposta de erro
   */
  async handleNL2SQLError(aiResponse, query, userId, sessionId) {
    const fallbackResponse = await this.getFallbackResponse('nl2sql', query);

    return {
      success: false,
      sql: null,
      explanation: fallbackResponse.message,
      confidence: 0,
      error: aiResponse.error,
      needsFallback: true,
      fallbackUsed: true
    };
  }

  /**
   * Trata erros de SQL-to-NL
   * @param {Object} aiResponse - Resposta com erro
   * @param {string} sqlQuery - Consulta SQL original
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @returns {Object} Resposta de erro
   */
  async handleSQL2NLError(aiResponse, sqlQuery, userId, sessionId) {
    const fallbackResponse = await this.getFallbackResponse('sql2nl', sqlQuery);

    return {
      success: false,
      explanation: fallbackResponse.message,
      confidence: 0,
      error: aiResponse.error,
      needsFallback: true,
      fallbackUsed: true
    };
  }

  /**
   * Obtém resposta de fallback
   * @param {string} type - Tipo de fallback
   * @param {string} originalQuery - Consulta original
   * @returns {Object} Resposta de fallback
   */
  async getFallbackResponse(type, originalQuery) {
    try {
      const fallbackType = this.fallbackService.determineFallbackType(type, null, 0);
      const fallback = await this.fallbackService.getFallback(fallbackType, originalQuery);

      // Log do uso do fallback
      await this.fallbackService.logFallbackUsage(fallbackType, originalQuery, null);

      return {
        message: fallback.message,
        escalationLevel: fallback.escalationLevel,
        suggestions: fallback.suggestions,
        shouldEscalate: fallback.shouldEscalate
      };

    } catch (error) {
      console.error('Erro ao buscar fallback:', error);
      return {
        message: type === 'nl2sql'
          ? 'Não consegui converter sua consulta para SQL. Tente reformular a pergunta ou seja mais específico.'
          : 'Não consegui explicar esta consulta SQL. Verifique se a sintaxe está correta.',
        escalationLevel: 1,
        suggestions: ['Tente novamente', 'Reformule sua pergunta'],
        shouldEscalate: false
      };
    }
  }
}

module.exports = NL2SQLService;
