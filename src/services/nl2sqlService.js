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
  async generateVisualContent(dataInDb, userId, sessionId, dbSchema, type,) {
    try {
      // Verifica cache primeiro
      const cached = await this.getCachedResponse(dataInDb, 'generateVisualContent');
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }

      // Constrói contexto da conversa
      // const conversationContext = await this.buildConversationContext(sessionId);

      // Cria prompt específico para NL-to-SQL
      // const prompt = this.buildNL2SQLPrompt(dataInDb, dbSchema, type, conversationContext);
      const typeOfApresentation = [
  'Bar Chart',
  'Line Chart',
  'Pie Chart',
  'Gantt Chart',
  'Flowchart',
  'Sequence Diagram',
  'Class Diagram',
  'State Diagram',
  'ER Diagram',
  'Journey Diagram',
  'Quadrant Chart'
];
      const conversationContext = '';
      const prompt = this.buildGVCPrompt(dataInDb, dbSchema, typeOfApresentation, conversationContext);

      console.log('\n\n\nprompt', prompt);
      // Chama IA
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'generateVisualContent',
        userId,
        sessionId
      });

      if (!aiResponse.success) {
        return this.handleNL2SQLError(aiResponse, dataInDb, userId, sessionId);
      }

      // Processa resposta
      const markdown = aiResponse.response || aiResponse;
      const result = {
        success: true,
        markdown,
        executionTime: aiResponse.executionTime
      };
      await this.cacheResponse(dataInDb, 'generateVisualContent', result);
      return result;

    } catch (error) {
      console.error('Erro na conversão NL-to-SQL:', error);
      return this.handleNL2SQLError({ error: error.message }, dataInDb, userId, sessionId);
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
   * Constrói prompt para NL-to-SQL
   * @param {string} query - Consulta em linguagem natural
   * @param {string} context - Contexto da conversa
   * @returns {string} Prompt formatado
   */
 buildGVCPrompt(dataInDb, dbSchema, typeOfApresentation, conversationContext) {
  return `
Você é um assistente especialista em **análise de dados e visualização**.  

Baseado nos dados e contexto fornecidos, gere um **markdown** com o melhor modelo de gráfico para apresentar os dados ou se possível apresente diretamente com apenas um destes: Mermaid ${typeOfApresentation.join(', ')}.

---

### Dados disponíveis
**Consulta:**  

${JSON.stringify(dataInDb, null, 2)}

**Esquema do banco de dados:** 
${JSON.stringify(dbSchema, null, 2)}

**Contexto da conversa:**  
${conversationContext}

**Tipo de apresentação:**  
${typeOfApresentation}

---

### Instruções:
- Analise os dados, o esquema e o contexto.  
- Escolha a melhor forma de visualização condizente com o tipo de apresentação, .  
- Retorne **somente o markdown ou Mermaid** que será renderizado no front-end.  
- Ajusta os dados para apresentação correta, por exemplo no data do pode vir em formato diferente.
- Certifica-se que esta completo e correto.
- Não inclua explicações adicionais.  

---

### Formato da Resposta:
- Sempre gere o Tipo de apresentação ou a apresentação mais adequada com os dados fornecidos.
- Sempre retornar **apenas markdown**.  

#### Exemplo válido:
\`\`\`markdown
**Negrito**, *itálico* e \`código inline\`
\`\`\`

#### Caso não seja possível gerar gráfico:
\`\`\`markdown
Nenhum gráfico adequado pode ser gerado com os dados fornecidos.
\`\`\`
`;
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
