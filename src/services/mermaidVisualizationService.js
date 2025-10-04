const AIService = require('./aiService');

class MermaidVisualizationService extends AIService {
  constructor() {
    super();
  }

  /**
   * Gera visualização Mermaid otimizada baseada nos dados
   * @param {Object} queryData - Dados da consulta executada
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @param {Object} dbSchema - Schema do banco de dados
   * @param {string} dbType - Tipo do banco de dados
   * @returns {Object} Resultado com Mermaid gerado
   */
  async generateMermaidVisualization(queryData, userId, sessionId, dbSchema, dbType) {
    try {
      // Verifica se há dados válidos para processar
      if (!queryData || queryData.error || !queryData.rows || queryData.rows.length === 0) {
        return {
          success: false,
          mermaid: this.generateErrorMermaid(queryData?.error || 'Nenhum dado disponível'),
          visualizationType: 'error',
          executionTime: 0
        };
      }

      // Verifica cache primeiro
      const cacheKey = this.generateMermaidCacheKey(queryData);
      const cached = await this.getCachedResponse(cacheKey, 'mermaidVisualization');
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }

      // Analisa os dados para determinar a melhor visualização
      const dataAnalysis = this.analyzeDataForMermaid(queryData);

      // Gera o prompt específico para Mermaid
      const prompt = this.buildMermaidPrompt(queryData, dataAnalysis, dbSchema, dbType);

      // Chama IA com configurações otimizadas para Mermaid
      const aiResponse = await this.generateResponse(prompt, {
        interactionType: 'mermaidVisualization',
        userId,
        sessionId,
        temperature: 0.2, // Baixa temperatura para consistência
        maxTokens: 1500
      });

      if (!aiResponse.success) {
        return this.handleMermaidError(aiResponse, queryData);
      }

      // Processa e valida o Mermaid gerado
      const processedMermaid = this.processMermaidResponse(aiResponse.response);
      const validationResult = this.validateMermaidSyntax(processedMermaid);

      if (!validationResult.isValid) {
        return this.handleMermaidError({ error: validationResult.error }, queryData);
      }

      const result = {
        success: true,
        mermaid: processedMermaid,
        visualizationType: dataAnalysis.recommendedType,
        dataStats: dataAnalysis.stats,
        chartTitle: dataAnalysis.suggestedTitle,
        executionTime: aiResponse.executionTime,
        metadata: {
          totalDataPoints: queryData.rows.length,
          columnsAnalyzed: queryData.columns.length,
          complexity: dataAnalysis.complexity
        }
      };

      // Cache apenas se for válido e de qualidade
      if (validationResult.isValid && dataAnalysis.complexity !== 'error') {
        await this.cacheResponse(cacheKey, 'mermaidVisualization', result);
      }

      return result;

    } catch (error) {
      console.error('Erro na geração de visualização Mermaid:', error);
      return this.handleMermaidError({ error: error.message }, queryData);
    }
  }

  /**
   * Analisa os dados para determinar a melhor visualização Mermaid
   * @param {Object} queryData - Dados da consulta
   * @returns {Object} Análise dos dados
   */
  analyzeDataForMermaid(queryData) {
    const { columns, rows } = queryData;
    const analysis = {
      dataTypes: {},
      recommendedType: 'table',
      complexity: 'simple',
      suggestedTitle: 'Análise de Dados',
      stats: {}
    };

    // Analisa cada coluna
    columns.forEach(column => {
      const values = rows.map(row => row[column]).filter(v => v !== null && v !== undefined);
      analysis.dataTypes[column] = this.detectColumnType(values);
    });

    // Determina o tipo de visualização baseado na análise
    const numericColumns = Object.keys(analysis.dataTypes).filter(col =>
      analysis.dataTypes[col] === 'numeric'
    );
    const categoricalColumns = Object.keys(analysis.dataTypes).filter(col =>
      analysis.dataTypes[col] === 'categorical'
    );
    const dateColumns = Object.keys(analysis.dataTypes).filter(col =>
      analysis.dataTypes[col] === 'date'
    );

    // **NOVA LÓGICA MELHORADA** para diferentes tipos de dados

    // Caso especial: Lista de tabelas/entidades (como seu exemplo)
    if (columns.length === 1 && categoricalColumns.length === 1 && rows.length > 5) {
      const columnName = columns[0].toLowerCase();
      if (columnName.includes('table') || columnName.includes('name') || columnName.includes('entity')) {
        analysis.recommendedType = 'mindmap';
        analysis.suggestedTitle = 'Estrutura do Banco de Dados';
        return analysis;
      }
    }

    // Caso: Apenas dados categóricos (sem numéricos) - como listas
    if (numericColumns.length === 0 && categoricalColumns.length >= 1) {
      if (rows.length <= 8) {
        analysis.recommendedType = 'pie';
        analysis.suggestedTitle = 'Distribuição dos Itens';
      } else if (rows.length <= 15) {
        analysis.recommendedType = 'flowchart';
        analysis.suggestedTitle = 'Diagrama de Componentes';
      } else {
        analysis.recommendedType = 'mindmap';
        analysis.suggestedTitle = 'Mapa Mental dos Dados';
      }
      return analysis;
    }

    // Caso: Dados temporais
    if (dateColumns.length >= 1 && numericColumns.length >= 1 && rows.length <= 15) {
      analysis.recommendedType = 'line';
      analysis.suggestedTitle = 'Evolução Temporal';
    }
    // Caso: Categoria vs Valor numérico
    else if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
      if (rows.length <= 8) {
        analysis.recommendedType = 'pie';
        analysis.suggestedTitle = 'Distribuição por Categoria';
      } else if (rows.length <= 15) {
        analysis.recommendedType = 'bar';
        analysis.suggestedTitle = 'Comparação por Categoria';
      } else {
        analysis.recommendedType = 'quadrant';
        analysis.suggestedTitle = 'Análise de Quadrantes';
      }
    }
    // Caso: Múltiplas categorias (relações)
    else if (categoricalColumns.length >= 2) {
      analysis.recommendedType = 'flowchart';
      analysis.suggestedTitle = 'Relações entre Dados';
    }
    // Caso: Tabela simples
    else if (rows.length <= 20 && columns.length <= 5) {
      analysis.recommendedType = 'table';
      analysis.suggestedTitle = 'Dados Tabulares';
    }
    // Fallback
    else {
      analysis.recommendedType = 'mindmap';
      analysis.suggestedTitle = 'Visão Geral dos Dados';
    }

    // Define complexidade
    if (rows.length > 20 || columns.length > 6) {
      analysis.complexity = 'high';
    } else if (rows.length > 10 || columns.length > 4) {
      analysis.complexity = 'medium';
    }

    // Estatísticas básicas
    analysis.stats = {
      totalRows: rows.length,
      totalColumns: columns.length,
      dataTypes: analysis.dataTypes,
      hasNumericData: numericColumns.length > 0,
      hasCategoricalData: categoricalColumns.length > 0,
      hasDateData: dateColumns.length > 0
    };

    return analysis;
  }

  /**
   * Detecta o tipo de uma coluna baseado nos valores
   * @param {Array} values - Valores da coluna
   * @returns {string} Tipo detectado
   */
  detectColumnType(values) {
    if (values.length === 0) return 'unknown';

    const sample = values.slice(0, Math.min(10, values.length));

    // Testa se é numérico
    if (sample.every(v => !isNaN(parseFloat(v)) && isFinite(v))) {
      return 'numeric';
    }

    // Testa se é data
    if (sample.every(v => !isNaN(Date.parse(v)))) {
      return 'date';
    }

    // Testa se é categórico (poucos valores únicos)
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length <= Math.max(5, values.length * 0.3)) {
      return 'categorical';
    }

    return 'text';
  }

  /**
   * Constrói prompt específico para geração de Mermaid
   * @param {Object} queryData - Dados da consulta
   * @param {Object} dataAnalysis - Análise dos dados
   * @param {Object} dbSchema - Schema do banco
   * @param {string} dbType - Tipo do banco
   * @returns {string} Prompt formatado
   */


  buildMermaidPrompt(queryData, dataAnalysis, dbSchema, dbType) {
    
    const chartTypes = {
      sequenceDiagram: `sequenceDiagram
  Alice->>John: Olá John, você poderia me ajudar com algo?
  John-->>Alice: Claro Alice, em que posso ajudar?
  Alice->>John: Preciso entender como funciona o sistema de autenticação.
  John-->>Alice: O sistema utiliza OAuth2 para autenticação segura.
`,
      bar: `xychart-beta
  title "Training progress"
  x-axis [mon, tues, wed, thur, fri, sat, sun]
  y-axis "Time trained (minutes)" 0 --> 300
  bar [60, 0, 120, 180, 230, 300, 0]
  line [60, 0, 120, 180, 230, 300, 0]`,
      pie: `pie title "Distribuição de Classes"
  pie [60, 40, 30, 50, 80]
`,
      line: `xychart-beta
  title "Evolução do Treinamento"
  x-axis [mon, tues, wed, thur, fri, sat, sun]
  x-axis [mon, tues, wed, thur, fri, sat, sun]
  y-axis "Tempo de Treinamento (minutos)" 0 --> 300
  line [60, 0, 120, 180, 230, 300, 0]
`,
      flowchart: `flowchart TD
  A[Usuários] --> B[Atividades]
  A --> C[Relatórios]
  B --> D[Interações]
  C --> E[Insights]
`,
      mindmap: `mindmap
  root((Base de Dados))
    Usuários
      User
      Institution
      Verification
    Relatórios
      Report
      ReportResolution
      UssdReport
    Sistema
      Notifications
      Alert
      Reward
`,
      classDiagram: `classDiagram
  class User {
    +String id
    +String name
    +String email
  }
  class Report {
    +String id
    +String userId
    +Date createdAt
  }
`,
      quadrant: `quadrantChart
  title "Análise de Desempenho"
  x-axis "Complexidade"
  y-axis "Impacto"
  point [1, 2]
  point [2, 3]
`,
      erDiagram: `erDiagram
  User {
    String id
    String name
    String email
  }
  Report {
    String id
    String userId
    Date createdAt
  }
`,
      timeline: `timeline
  title "Linha do Tempo de Eventos"
  2023-01-01 : "Evento 1"
  2023-01-02 : "Evento 2"
`
    };
    const { recommendedType, suggestedTitle, stats } = dataAnalysis;
    const sampleData = queryData.rows;

    return `Você é um especialista em visualização de dados que gera exclusivamente diagramas Mermaid.

**DADOS PARA VISUALIZAÇÃO:**
- Tipos de Apresentação Disponíveis e seus exemplos: ${Object.keys(chartTypes).join(', ')}
- Tipo recomendado: ${recommendedType}
- Título sugerido: ${suggestedTitle}
- Total de registros: ${stats.totalRows}
- Colunas: ${queryData.columns.join(', ')}

**AMOSTRA DOS DADOS (máximo 5 linhas):**
${JSON.stringify(sampleData, null, 2)}

**ESTATÍSTICAS:**
- Dados numéricos: ${stats.hasNumericData ? 'Sim' : 'Não'}
- Dados categóricos: ${stats.hasCategoricalData ? 'Sim' : 'Não'}  
- Dados temporais: ${stats.hasDateData ? 'Sim' : 'Não'}

**INSTRUÇÕES CRÍTICAS:**
1. Gere APENAS código Mermaid válido
2. Use o tipo recomendado: ${recommendedType}
3. Máximo 15 elementos para clareza visual
4. Use cores harmoniosas
5. Títulos claros e descritivos
6. NÃO inclua \`\`\`mermaid ou \`\`\`
7. Responda APENAS com o código Mermaid válido
8. Tenha muita atenção à sintaxe e estrutura Mermaid e Certifique-se de que o código é funcional e correto atualmente.

**REGRAS ESPECÍFICAS POR TIPO:**
- Para listas de tabelas/entidades: Use mindmap ou flowchart
- Para dados apenas categóricos: Use flowchart ou mindmap
- Para dados numéricos: Use bar, pie ou line
- Para relações: Use flowchart

**TIPOS MERMAID DISPONÍVEIS:**
- bar: gráfico de barras (xychart-beta com bar)
- pie: gráfico pizza (pie title)  
- line: gráfico de linha (xychart-beta com line)
- flowchart: fluxograma (flowchart TD)
- mindmap: mapa mental (mindmap)
- table: tabela estruturada

**EXEMPLOS ESPECÍFICOS:**

**Para lista de tabelas (como seu caso):**
\`\`\`
mindmap
  root((Base de Dados))
    Usuários
      User
      Institution
      Verification
    Relatórios
      Report
      ReportResolution
      UssdReport
    Sistema
      Notifications
      Alert
      Reward
\`\`\`

**Para flowchart de tabelas:**
\`\`\`
flowchart TD
    A[Sistema Principal] --> B[Usuários]
    A --> C[Relatórios] 
    A --> D[Notificações]
    B --> E[User]
    B --> F[Institution]
    C --> G[Report]
    C --> H[ReportResolution]
    D --> I[Notifications]
    D --> J[Alert]
\`\`\`
- classDiagram (classDiagram)
- quadrant: análise quadrante (quadrantChart)

**EXEMPLO DE SAÍDA ESPERADA:**
%%{init: {"theme":"base", "themeVariables": {"primaryColor":"#4CAF50"}}}%%
xychart-beta
    title "${suggestedTitle}"
    x-axis [${queryData.columns.slice(0, 3).map(col => `"${col}"`).join(', ')}]
    y-axis "Valores"
    bar [${sampleData.map(row => Object.values(row)[1] || 0).slice(0, 5).join(', ')}]

**REGRAS FINAIS:**
- Responda APENAS com código Mermaid
- Use dados reais fornecidos
- Mantenha sintaxe Mermaid válida
- Priorize legibilidade visual`;
  }

  /**
   * Processa a resposta Mermaid da IA
   * @param {string} response - Resposta bruta da IA
   * @returns {string} Mermaid processado
   */
  processMermaidResponse(response) {
    if (!response) {
      return this.generateErrorMermaid('Resposta vazia da IA');
    }

    // Remove possíveis marcadores de código
    let cleaned = response
      .replace(/```mermaid\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/^mermaid\s*/g, '')
      .trim();

    // Verifica se tem conteúdo Mermaid válido
    const validPatterns = [
      '%%{init:', 'chart', 'flowchart', 'pie', 'quadrant',
      'xychart', 'mindmap', 'classDiagram', 'erDiagram'
    ];

    const hasValidPattern = validPatterns.some(pattern =>
      cleaned.toLowerCase().includes(pattern.toLowerCase())
    );

    if (!hasValidPattern) {
      return this.generateErrorMermaid('Formato Mermaid inválido');
    }

    // Limpa quebras de linha desnecessárias mantendo a estrutura
    cleaned = cleaned
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    return cleaned;
  }

  /**
   * Valida sintaxe básica do Mermaid
   * @param {string} mermaidCode - Código Mermaid
   * @returns {Object} Resultado da validação
   */
  validateMermaidSyntax(mermaidCode) {
    try {
      // Validações básicas de sintaxe Mermaid
      const validTypes = [
        'chart', 'flowchart', 'pie', 'quadrant', 'xychart', 'bar',
        'mindmap', 'classDiagram', 'erDiagram', 'timeline'
      ];
      const hasValidType = validTypes.some(type =>
        mermaidCode.toLowerCase().includes(type.toLowerCase())
      );

      if (!hasValidType) {
        return { isValid: false, error: 'Tipo de diagrama Mermaid não reconhecido' };
      }

      // Verifica se tem estrutura mínima
      if (mermaidCode.length < 20) {
        return { isValid: false, error: 'Código Mermaid muito curto' };
      }

      // Validações específicas por tipo
      if (mermaidCode.includes('mindmap')) {
        // Validação para mindmap
        if (!mermaidCode.includes('root') && !mermaidCode.includes('((')) {
          return { isValid: false, error: 'Mindmap deve ter um nó raiz' };
        }
      }

      if (mermaidCode.includes('flowchart')) {
        // Validação para flowchart
        if (!mermaidCode.includes('-->') && !mermaidCode.includes('---')) {
          return { isValid: false, error: 'Flowchart deve ter conexões entre nós' };
        }
      }

      if (mermaidCode.includes('pie')) {
        // Validação para pie chart
        if (!mermaidCode.includes(':')) {
          return { isValid: false, error: 'Pie chart deve ter formato "label : valor"' };
        }
      }

      // Verifica balanceamento básico de caracteres (apenas para flowcharts)
      if (mermaidCode.includes('flowchart')) {
        const openBrackets = (mermaidCode.match(/\[/g) || []).length;
        const closeBrackets = (mermaidCode.match(/\]/g) || []).length;
        const openParens = (mermaidCode.match(/\(/g) || []).length;
        const closeParens = (mermaidCode.match(/\)/g) || []).length;

        if (Math.abs(openBrackets - closeBrackets) > 2 || Math.abs(openParens - closeParens) > 2) {
          return { isValid: false, error: 'Desbalanceamento de caracteres em flowchart' };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Gera chave de cache para Mermaid
   * @param {Object} queryData - Dados da consulta
   * @returns {string} Chave de cache
   */
  generateMermaidCacheKey(queryData) {
    const signature = {
      columns: queryData.columns,
      rowCount: queryData.rows.length,
      dataHash: this.generateDataHash(queryData.rows.slice(0, 3))
    };
    return JSON.stringify(signature);
  }

  /**
   * Gera hash dos dados para cache
   * @param {Array} rows - Linhas dos dados
   * @returns {string} Hash
   */
  generateDataHash(rows) {
    return JSON.stringify(rows).slice(0, 50);
  }

  /**
   * Gera Mermaid de erro
   * @param {string} errorMessage - Mensagem de erro
   * @returns {string} Mermaid de erro
   */
  generateErrorMermaid(errorMessage) {
    return `%%{init: {"theme":"base", "themeVariables": {"primaryColor":"#f44336"}}}%%
flowchart TD
    A[⚠️ Erro na Visualização] --> B[${errorMessage}]
    B --> C[Tente novamente]
    style A fill:#ffebee
    style B fill:#ffcdd2
    style C fill:#e8f5e8`;
  }

  /**
   * Trata erros na geração de Mermaid
   * @param {Object} aiResponse - Resposta com erro
   * @param {Object} queryData - Dados da consulta original
   * @returns {Object} Resposta de erro
   */
  handleMermaidError(aiResponse, queryData) {
    const errorMermaid = this.generateErrorMermaid(
      aiResponse.error || 'Erro desconhecido na geração de visualização'
    );

    return {
      success: false,
      mermaid: errorMermaid,
      visualizationType: 'error',
      error: aiResponse.error,
      executionTime: 0,
      fallbackUsed: true
    };
  }
}

module.exports = MermaidVisualizationService;
