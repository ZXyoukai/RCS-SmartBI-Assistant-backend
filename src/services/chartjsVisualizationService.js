const { default: axios } = require('axios');

class ChartJSVisualizationService {
  constructor() {
    this.apiKey = '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';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  /**
   * Gera configuração Chart.js baseada nos dados da consulta
   * @param {Object} queryResult - Resultado da consulta SQL
   * @param {number} userId - ID do usuário
   * @param {number} sessionId - ID da sessão
   * @param {Object} schema - Schema do banco de dados
   * @param {string} type - Tipo do banco de dados
   * @returns {Object} Configuração Chart.js
   */
  async generateChartJSVisualization(queryResult, userId, sessionId, schema, type) {
    try {
      if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) {
        return this.generateEmptyDataChart();
      }

      // Analisa os dados para determinar o melhor tipo de gráfico
      const chartConfig = await this.analyzeDataAndGenerateChart(queryResult);
      
      return {
        success: true,
        chartConfig: chartConfig,
        chartConfigSanitized: this.sanitizeChartConfig(chartConfig), // Versão sem funções para salvar no DB
        visualizationType: chartConfig.type,
        chartTitle: chartConfig.options?.plugins?.title?.text || 'Visualização de Dados',
        dataStats: this.generateDataStats(queryResult),
        executionTime: Date.now(),
        metadata: {
          totalDataPoints: queryResult.rows.length,
          columnsCount: queryResult.columns.length,
          chartType: chartConfig.type,
          hasTimeSeries: this.detectTimeSeries(queryResult),
          hasNumericData: this.detectNumericData(queryResult)
        }
      };
    } catch (error) {
      console.error('Erro ao gerar visualização Chart.js:', error);
      return this.generateErrorChart(error.message);
    }
  }

  /**
   * Analisa os dados e gera configuração Chart.js otimizada
   */
  async analyzeDataAndGenerateChart(queryResult) {
    const { columns, rows } = queryResult;
    
    // Detecta tipos de dados
    const dataTypes = this.analyzeDataTypes(columns, rows);
    const chartType = this.determineChartType(dataTypes, columns, rows);
    
    let chartConfig;

    switch (chartType) {
      case 'pie':
        chartConfig = this.generatePieChart(columns, rows, dataTypes);
        break;
      case 'bar':
        chartConfig = this.generateBarChart(columns, rows, dataTypes);
        break;
      case 'line':
        chartConfig = this.generateLineChart(columns, rows, dataTypes);
        break;
      case 'doughnut':
        chartConfig = this.generateDoughnutChart(columns, rows, dataTypes);
        break;
      // case 'scatter':
      //   chartConfig = this.generateScatterChart(columns, rows, dataTypes);
      //   break;
      case 'radar':
        chartConfig = this.generateRadarChart(columns, rows, dataTypes);
        break;
      default:
        chartConfig = this.generateBarChart(columns, rows, dataTypes);
    }

    return chartConfig;
  }

  /**
   * Remove funções do objeto Chart.js para permitir serialização
   */
  sanitizeChartConfig(chartConfig) {
    const sanitized = JSON.parse(JSON.stringify(chartConfig, (key, value) => {
      // Remove funções que não podem ser serializadas
      if (typeof value === 'function') {
        return undefined;
      }
      return value;
    }));

    // Remove propriedades que contêm funções
    if (sanitized.options?.plugins?.tooltip?.callbacks) {
      delete sanitized.options.plugins.tooltip.callbacks;
    }

    if (sanitized.options?.plugins?.legend?.labels?.generateLabels) {
      delete sanitized.options.plugins.legend.labels.generateLabels;
    }

    return sanitized;
  }

  /**
   * Analisa tipos de dados das colunas - Versão melhorada
   */
  analyzeDataTypes(columns, rows) {
    const types = {};
    
    columns.forEach(column => {
      const values = rows.map(row => row[column]).filter(val => val !== null && val !== undefined);
      
      if (values.length === 0) {
        types[column] = 'empty';
        return;
      }

      // 1. Detecta se é data primeiro (mais específico)
      const dateValues = values.filter(val => {
        if (val instanceof Date) return true;
        if (typeof val === 'string' && !isNaN(Date.parse(val))) {
          // Verifica se é uma data válida e não apenas um número
          const date = new Date(val);
          return date instanceof Date && !isNaN(date) && 
                 (val.includes('-') || val.includes('/'));
        }
        return false;
      });
      
      if (dateValues.length / values.length > 0.8) {
        types[column] = 'date';
        return;
      }

      // 2. Detecta IDs (números sequenciais ou identificadores)
      if (column.toLowerCase().includes('id') || 
          column.toLowerCase() === 'codigo' || 
          column.toLowerCase() === 'key') {
        types[column] = 'categorical';
        return;
      }

      // 3. Detecta se é numérico puro (sem formatação)
      const numericValues = values.filter(val => {
        if (typeof val === 'number') return !isNaN(val) && isFinite(val);
        if (typeof val === 'string') {
          const cleaned = val.trim();
          // Ignora strings com formatação monetária ou outros símbolos
          if (cleaned.includes('R$') || cleaned.includes('%') || 
              cleaned.includes(',') || cleaned.includes('.') && cleaned.split('.').length > 2) {
            return false;
          }
          const num = Number(cleaned);
          return !isNaN(num) && isFinite(num) && cleaned !== '';
        }
        return false;
      });
      
      // Para ser numérico, deve ter alta proporção de números E não ser um ID
      if (numericValues.length / values.length > 0.8 && 
          !column.toLowerCase().includes('id') && 
          !column.toLowerCase().includes('codigo')) {
        
        // Se há apenas 1 valor, ainda pode ser numérico
        if (values.length === 1 || values.length <= 3) {
          types[column] = 'numeric';
          return;
        }
        
        // Para múltiplos valores, verifica se há variação
        const numValues = numericValues.map(val => Number(typeof val === 'string' ? val.trim() : val));
        const hasVariation = Math.max(...numValues) - Math.min(...numValues) > 0;
        
        if (hasVariation || numValues.length >= 3) {
          types[column] = 'numeric';
          return;
        }
      }

      // 4. Detecta categórico por nome da coluna ou poucos valores únicos
      const uniqueValues = new Set(values);
      const uniqueRatio = uniqueValues.size / values.length;
      
      // Palavras-chave que indicam dados categóricos
      const categoricalKeywords = [
        'status', 'tipo', 'categoria', 'regiao', 'estado', 'cidade', 
        'departamento', 'produto', 'marca', 'grupo', 'classe',
        'nome', 'descricao', 'title'
      ];
      const isCategoricalByName = categoricalKeywords.some(keyword => 
        column.toLowerCase().includes(keyword)
      );
      
      if (isCategoricalByName || 
          (uniqueValues.size <= Math.min(15, values.length * 0.6) && uniqueRatio < 0.8)) {
        types[column] = 'categorical';
        return;
      }

      types[column] = 'text';
    });

    return types;
  }

  /**
   * Determina o melhor tipo de gráfico baseado nos dados
   */
  determineChartType(dataTypes, columns, rows) {
    const numericColumns = Object.keys(dataTypes).filter(col => dataTypes[col] === 'numeric');
    const categoricalColumns = Object.keys(dataTypes).filter(col => dataTypes[col] === 'categorical');
    const dateColumns = Object.keys(dataTypes).filter(col => dataTypes[col] === 'date');

    // Se tem data + numérico = linha temporal
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      return 'line';
    }

    // Se tem 1 categórico + 1 numérico = barras ou pizza
    if (categoricalColumns.length === 1 && numericColumns.length === 1) {
      const uniqueCategories = new Set(rows.map(row => row[categoricalColumns[0]])).size;
      return uniqueCategories <= 6 ? 'pie' : 'bar';
    }

    // Se tem 2 numéricos = scatter
    if (numericColumns.length === 2) {
      return 'scatter';
    }

    // Se tem múltiplos categóricos + numéricos = radar ou bar
    if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
      return numericColumns.length >= 3 ? 'radar' : 'bar';
    }

    // Padrão
    return 'bar';
  }

  /**
   * Gera gráfico de pizza
   */
  generatePieChart(columns, rows, dataTypes) {
    const categoryCol = Object.keys(dataTypes).find(col => dataTypes[col] === 'categorical');
    const numericCol = Object.keys(dataTypes).find(col => dataTypes[col] === 'numeric');

    if (!categoryCol || !numericCol) {
      return this.generateBarChart(columns, rows, dataTypes);
    }

    // Agrega dados e converte para números
    const aggregatedData = {};
    rows.forEach(row => {
      const key = String(row[categoryCol] || 'Unknown');
      const value = Number(row[numericCol]) || 0;
      aggregatedData[key] = (aggregatedData[key] || 0) + value;
    });

    // Ordena por valor decrescente
    const sortedEntries = Object.entries(aggregatedData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Limita a 10 categorias para melhor visualização
    
    return {
      type: 'pie',
      data: {
        labels: sortedEntries.map(([key]) => key),
        datasets: [{
          label: numericCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          data: sortedEntries.map(([, value]) => value),
          backgroundColor: this.generateColors(sortedEntries.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${numericCol.replace(/_/g, ' ')} by ${categoryCol.replace(/_/g, ' ')}`
          },
          legend: {
            position: 'right',
            labels: {
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, index) => {
                    const value = data.datasets[0].data[index];
                    const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[index],
                      strokeStyle: data.datasets[0].borderColor,
                      lineWidth: data.datasets[0].borderWidth,
                      hidden: false,
                      index: index
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }

  /**
   * Gera gráfico de barras
   */
  generateBarChart(columns, rows, dataTypes) {
    const categoryCol = Object.keys(dataTypes).find(col => dataTypes[col] === 'categorical') || columns[0];
    const numericCols = Object.keys(dataTypes).filter(col => dataTypes[col] === 'numeric');
    
    if (numericCols.length === 0) {
      // Conta ocorrências se não há colunas numéricas
      const counts = {};
      rows.forEach(row => {
        const key = String(row[categoryCol] || 'Unknown');
        counts[key] = (counts[key] || 0) + 1;
      });

      // Ordena por valor decrescente
      const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

      return {
        type: 'bar',
        data: {
          labels: sortedEntries.map(([key]) => key),
          datasets: [{
            label: 'Count',
            data: sortedEntries.map(([, value]) => value),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Count of ${categoryCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Count'
              }
            },
            x: {
              title: {
                display: true,
                text: categoryCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              }
            }
          }
        }
      };
    }

    // Para dados com colunas numéricas
    const aggregatedData = {};
    
    // Agrupa e soma os dados por categoria
    rows.forEach(row => {
      const key = String(row[categoryCol] || 'Unknown');
      if (!aggregatedData[key]) {
        aggregatedData[key] = {};
        numericCols.forEach(col => {
          aggregatedData[key][col] = 0;
        });
      }
      
      numericCols.forEach(col => {
        const value = Number(row[col]) || 0;
        aggregatedData[key][col] += value;
      });
    });

    // Ordena categorias por total (soma de todas as colunas numéricas)
    const sortedCategories = Object.keys(aggregatedData).sort((a, b) => {
      const totalA = numericCols.reduce((sum, col) => sum + aggregatedData[a][col], 0);
      const totalB = numericCols.reduce((sum, col) => sum + aggregatedData[b][col], 0);
      return totalB - totalA;
    });

    const datasets = numericCols.map((col, index) => {
      const colors = this.generateColors(1, index);
      
      return {
        label: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data: sortedCategories.map(category => aggregatedData[category][col]),
        backgroundColor: colors[0].replace('1)', '0.8)'),
        borderColor: colors[0],
        borderWidth: 1
      };
    });

    return {
      type: 'bar',
      data: {
        labels: sortedCategories,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${numericCols.map(col => col.replace(/_/g, ' ')).join(', ')} by ${categoryCol.replace(/_/g, ' ')}`
          },
          legend: {
            display: numericCols.length > 1,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: numericCols.length === 1 ? 
                numericCols[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                'Values'
            }
          },
          x: {
            title: {
              display: true,
              text: categoryCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
          }
        }
      }
    };
  }

  /**
   * Gera gráfico de linha
   */
  generateLineChart(columns, rows, dataTypes) {
    const dateCol = Object.keys(dataTypes).find(col => dataTypes[col] === 'date');
    const numericCols = Object.keys(dataTypes).filter(col => dataTypes[col] === 'numeric');

    if (!dateCol || numericCols.length === 0) {
      return this.generateBarChart(columns, rows, dataTypes);
    }

    // Ordena por data e converte valores
    const sortedRows = rows
      .map(row => ({
        ...row,
        [dateCol]: new Date(row[dateCol]),
        ...numericCols.reduce((acc, col) => {
          // Converte strings numéricas para números
          const value = typeof row[col] === 'string' ? Number(row[col].trim()) : Number(row[col]);
          acc[col] = isNaN(value) ? 0 : value;
          return acc;
        }, {})
      }))
      .sort((a, b) => a[dateCol] - b[dateCol]);
    
    // Gera labels ordenados
    const labels = sortedRows.map(row => row[dateCol].toISOString().split('T')[0]);
    
    const datasets = numericCols.map((col, index) => {
      const colors = this.generateColors(1, index);
      
      return {
        label: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data: sortedRows.map(row => row[col]),
        borderColor: colors[0],
        backgroundColor: colors[0].replace('1)', '0.2)'),
        tension: 0.1,
        fill: false
      };
    });

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: `${numericCols.map(col => col.replace(/_/g, ' ')).join(', ')} over time`
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                const dateStr = context[0].label;
                const date = new Date(dateStr);
                return date.toLocaleDateString('pt-BR');
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: dateCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: numericCols.length === 1 ? 
                numericCols[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                'Values'
            }
          }
        }
      }
    };
  }

  /**
   * Gera gráfico de dispersão
   */
  generateScatterChart(columns, rows, dataTypes) {
    const numericCols = Object.keys(dataTypes).filter(col => dataTypes[col] === 'numeric');
    
    if (numericCols.length < 2) {
      return this.generateBarChart(columns, rows, dataTypes);
    }

    const xCol = numericCols[0];
    const yCol = numericCols[1];

    // Converte e filtra dados válidos
    const validData = rows
      .map(row => ({
        x: this.convertToNumber(row[xCol]),
        y: this.convertToNumber(row[yCol])
      }))
      .filter(point => point.x !== null && point.y !== null);

    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${yCol.replace(/_/g, ' ')} vs ${xCol.replace(/_/g, ' ')}`,
          data: validData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${yCol.replace(/_/g, ' ')} vs ${xCol.replace(/_/g, ' ')}`
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: xCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
          },
          y: {
            title: {
              display: true,
              text: yCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
          }
        }
      }
    };
  }

  /**
   * Gera gráfico radar
   */
  generateRadarChart(columns, rows, dataTypes) {
    const numericCols = Object.keys(dataTypes).filter(col => dataTypes[col] === 'numeric');
    const categoryCol = Object.keys(dataTypes).find(col => dataTypes[col] === 'categorical');

    if (numericCols.length < 3 || !categoryCol) {
      return this.generateBarChart(columns, rows, dataTypes);
    }

    const categories = [...new Set(rows.map(row => row[categoryCol]))].slice(0, 5);
    
    const datasets = categories.map((category, index) => {
      const categoryRows = rows.filter(row => row[categoryCol] === category);
      const avgValues = numericCols.map(col => {
        const values = categoryRows.map(row => Number(row[col])).filter(val => !isNaN(val));
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      });

      const colors = this.generateColors(1, index);

      return {
        label: category,
        data: avgValues,
        borderColor: colors[0],
        backgroundColor: colors[0].replace('1)', '0.2)'),
        pointBackgroundColor: colors[0]
      };
    });

    return {
      type: 'radar',
      data: {
        labels: numericCols,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Multi-dimensional Analysis by ${categoryCol}`
          }
        },
        scales: {
          r: {
            beginAtZero: true
          }
        }
      }
    };
  }

  /**
   * Gera gráfico doughnut
   */
  generateDoughnutChart(columns, rows, dataTypes) {
    const pieConfig = this.generatePieChart(columns, rows, dataTypes);
    pieConfig.type = 'doughnut';
    return pieConfig;
  }

  /**
   * Agrega dados por categoria
   */
  aggregateData(rows, categoryCol, numericCol) {
    const aggregated = {};
    
    rows.forEach(row => {
      const key = String(row[categoryCol] || 'Unknown');
      const value = this.convertToNumber(row[numericCol]);
      
      if (value !== null && !isNaN(value)) {
        aggregated[key] = (aggregated[key] || 0) + value;
      }
    });

    return aggregated;
  }

  /**
   * Converte valor para número, lidando com strings numéricas
   */
  convertToNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return isNaN(value) ? null : value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return null;
      const num = Number(trimmed);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Gera cores para gráficos
   */
  generateColors(count, startIndex = 0) {
    const colors = [
      'rgba(255, 99, 132, 1)',   // Vermelho
      'rgba(54, 162, 235, 1)',   // Azul
      'rgba(255, 205, 86, 1)',   // Amarelo
      'rgba(75, 192, 192, 1)',   // Verde
      'rgba(153, 102, 255, 1)',  // Roxo
      'rgba(255, 159, 64, 1)',   // Laranja
      'rgba(199, 199, 199, 1)',  // Cinza
      'rgba(83, 102, 255, 1)',   // Azul escuro
      'rgba(255, 99, 255, 1)',   // Rosa
      'rgba(99, 255, 132, 1)'    // Verde claro
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[(startIndex + i) % colors.length]);
    }
    
    return result;
  }

  /**
   * Detecta se há dados de série temporal
   */
  detectTimeSeries(queryResult) {
    return queryResult.columns.some(col => {
      const values = queryResult.rows.map(row => row[col]).filter(val => val !== null && val !== undefined);
      const dateValues = values.filter(val => {
        if (val instanceof Date) return true;
        if (typeof val === 'string' && !isNaN(Date.parse(val))) {
          const date = new Date(val);
          return date instanceof Date && !isNaN(date) && val.includes('-');
        }
        return false;
      });
      return dateValues.length / values.length > 0.8;
    });
  }

  /**
   * Detecta se há dados numéricos
   */
  detectNumericData(queryResult) {
    return queryResult.columns.some(col => {
      const values = queryResult.rows.map(row => row[col]).filter(val => val !== null && val !== undefined);
      const numericValues = values.filter(val => this.convertToNumber(val) !== null);
      return numericValues.length / values.length > 0.8;
    });
  }

  /**
   * Gera estatísticas dos dados
   */
  generateDataStats(queryResult) {
    const { columns, rows } = queryResult;
    
    const stats = {
      totalRows: rows.length,
      totalColumns: columns.length,
      columnTypes: {},
      dataQuality: {}
    };

    columns.forEach(col => {
      const values = rows.map(row => row[col]);
      const nonNullValues = values.filter(val => val !== null && val !== undefined);
      
      stats.dataQuality[col] = {
        completeness: nonNullValues.length / values.length,
        uniqueValues: new Set(nonNullValues).size
      };

      // Determina tipo usando funções melhoradas
      const numericValues = nonNullValues.filter(val => this.convertToNumber(val) !== null);
      if (numericValues.length / nonNullValues.length > 0.8) {
        stats.columnTypes[col] = 'numeric';
        const numbers = numericValues.map(val => this.convertToNumber(val)).filter(n => n !== null);
        if (numbers.length > 0) {
          stats.dataQuality[col].min = Math.min(...numbers);
          stats.dataQuality[col].max = Math.max(...numbers);
          stats.dataQuality[col].avg = Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
        }
      } else {
        // Verifica se é data
        const dateValues = nonNullValues.filter(val => {
          if (val instanceof Date) return true;
          if (typeof val === 'string' && !isNaN(Date.parse(val))) {
            const date = new Date(val);
            return date instanceof Date && !isNaN(date) && val.includes('-');
          }
          return false;
        });
        
        if (dateValues.length / nonNullValues.length > 0.8) {
          stats.columnTypes[col] = 'date';
        } else {
          stats.columnTypes[col] = 'categorical';
        }
      }
    });

    return stats;
  }

  /**
   * Gera gráfico para dados vazios
   */
  generateEmptyDataChart() {
    const chartConfig = {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'No data available',
          data: [0],
          backgroundColor: 'rgba(201, 203, 207, 0.6)',
          borderColor: 'rgba(201, 203, 207, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'No Data Found'
          }
        }
      }
    };

    return {
      success: true,
      chartConfig: chartConfig,
      chartConfigSanitized: this.sanitizeChartConfig(chartConfig),
      visualizationType: 'empty',
      chartTitle: 'No Data Available',
      dataStats: { totalRows: 0, totalColumns: 0 },
      executionTime: 0,
      metadata: { totalDataPoints: 0 }
    };
  }

  /**
   * Gera gráfico de erro
   */
  generateErrorChart(errorMessage) {
    const chartConfig = {
      type: 'bar',
      data: {
        labels: ['Error'],
        datasets: [{
          label: 'Error occurred',
          data: [1],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Error in Data Visualization'
          }
        }
      }
    };

    return {
      success: false,
      error: errorMessage,
      chartConfig: chartConfig,
      chartConfigSanitized: this.sanitizeChartConfig(chartConfig),
      visualizationType: 'error',
      chartTitle: 'Error',
      executionTime: 0
    };
  }
}

module.exports = ChartJSVisualizationService;
