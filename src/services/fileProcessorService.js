const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');

class FileProcessorService {
  constructor() {
    this.supportedTypes = {
      csv: ['text/csv', 'application/csv'],
      excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      sql: ['text/sql', 'application/sql', 'text/plain'],
      json: ['application/json']
    };
  }

  /**
   * Processa arquivo CSV a partir de buffer
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {Object} Schema e dados de amostra
   */
  async processCSV(fileBuffer, fileName) {
    return new Promise((resolve, reject) => {
      const results = [];
      const schema = {};
      let headerProcessed = false;

      // Criar stream a partir do buffer
      const stream = Readable.from(fileBuffer.toString());
      
      stream
        .pipe(csv())
        .on('data', (data) => {
          if (!headerProcessed) {
            // Analisa os headers para gerar schema
            Object.keys(data).forEach(key => {
              schema[key] = {
                type: this.detectDataType(data[key]),
                nullable: true,
                description: `Campo ${key} importado de CSV`
              };
            });
            headerProcessed = true;
          }
          
          if (results.length < 100) { // Limita amostra a 100 registros
            results.push(data);
          }
        })
        .on('end', () => {
          resolve({
            schema: { 
              [path.basename(fileName, '.csv')]: {
                columns: schema,
                type: 'table',
                source: 'csv_upload'
              }
            },
            sampleData: results,
            totalRows: results.length,
            type: 'CSV'
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Processa arquivo Excel a partir de buffer
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {Object} Schema e dados de amostra
   */
  async processExcel(fileBuffer, fileName) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const schemas = {};
      const sampleData = {};

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        if (data.length > 0) {
          const schema = {};
          Object.keys(data[0]).forEach(key => {
            schema[key] = {
              type: this.detectDataType(data[0][key]),
              nullable: true,
              description: `Campo ${key} importado de Excel (${sheetName})`
            };
          });

          schemas[sheetName] = {
            columns: schema,
            type: 'table',
            source: 'excel_upload'
          };

          sampleData[sheetName] = data.slice(0, 100); // Amostra de 100 registros
        }
      });

      return {
        schema: schemas,
        sampleData,
        totalSheets: workbook.SheetNames.length,
        type: 'Excel'
      };
    } catch (error) {
      throw new Error(`Erro ao processar Excel: ${error.message}`);
    }
  }

  /**
   * Processa arquivo SQL a partir de buffer
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {Object} Schema extraído do SQL
   */
  async processSQL(fileBuffer, fileName) {
    try {
      const sqlContent = fileBuffer.toString('utf8');
      const schema = this.parseSQLSchema(sqlContent);
      
      return {
        schema,
        sqlContent: sqlContent.length > 10000 ? sqlContent.substring(0, 10000) + '...' : sqlContent,
        type: 'SQL'
      };
    } catch (error) {
      throw new Error(`Erro ao processar SQL: ${error.message}`);
    }
  }

  /**
   * Processa arquivo JSON a partir de buffer
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {Object} Schema e dados de amostra
   */
  async processJSON(fileBuffer, fileName) {
    try {
      const jsonContent = fileBuffer.toString('utf8');
      const data = JSON.parse(jsonContent);
      
      let schema = {};
      let sampleData = [];

      if (Array.isArray(data)) {
        // Array de objetos
        if (data.length > 0 && typeof data[0] === 'object') {
          const columns = {};
          Object.keys(data[0]).forEach(key => {
            columns[key] = {
              type: this.detectDataType(data[0][key]),
              nullable: true,
              description: `Campo ${key} importado de JSON`
            };
          });

          schema = {
            [path.basename(fileName, '.json')]: {
              columns,
              type: 'table',
              source: 'json_upload'
            }
          };
          sampleData = data.slice(0, 100);
        }
      } else if (typeof data === 'object') {
        // Objeto único - trata como configuração/schema
        schema = data;
      }

      return {
        schema,
        sampleData,
        totalRows: Array.isArray(data) ? data.length : 1,
        type: 'JSON'
      };
    } catch (error) {
      throw new Error(`Erro ao processar JSON: ${error.message}`);
    }
  }

  /**
   * Detecta o tipo de dados baseado no valor
   * @param {any} value - Valor a ser analisado
   * @returns {string} Tipo detectado
   */
  detectDataType(value) {
    if (value === null || value === undefined || value === '') {
      return 'text';
    }

    // Testa se é número
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      return parseFloat(value) % 1 === 0 ? 'integer' : 'numeric';
    }

    // Testa se é data
    if (!isNaN(Date.parse(value))) {
      return 'date';
    }

    // Testa se é boolean
    if (value === 'true' || value === 'false' || typeof value === 'boolean') {
      return 'boolean';
    }

    // Default para texto
    return 'text';
  }

  /**
   * Parseia SQL e extrai schema básico
   * @param {string} sqlContent - Conteúdo SQL
   * @returns {Object} Schema extraído
   */
  parseSQLSchema(sqlContent) {
    const schema = {};
    
    // Regex básico para extrair CREATE TABLE
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[\`\"]?(\w+)[\`\"]?\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = tableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const columnsStr = match[2];
      const columns = {};

      // Parseia colunas
      const columnLines = columnsStr.split(',').map(line => line.trim());
      
      columnLines.forEach(line => {
        const columnMatch = line.match(/[\`\"]?(\w+)[\`\"]?\s+(\w+)(\([\d,\s]+\))?\s*(.*)/i);
        if (columnMatch) {
          const [, columnName, dataType, , constraints] = columnMatch;
          
          columns[columnName] = {
            type: this.mapSQLTypeToGeneric(dataType),
            nullable: !constraints?.includes('NOT NULL'),
            primaryKey: constraints?.includes('PRIMARY KEY'),
            description: `Campo ${columnName} extraído de SQL`
          };
        }
      });

      schema[tableName] = {
        columns,
        type: 'table',
        source: 'sql_upload'
      };
    }

    return schema;
  }

  /**
   * Mapeia tipos SQL para tipos genéricos
   * @param {string} sqlType - Tipo SQL
   * @returns {string} Tipo genérico
   */
  mapSQLTypeToGeneric(sqlType) {
    const typeMap = {
      'INT': 'integer',
      'INTEGER': 'integer',
      'BIGINT': 'integer',
      'SMALLINT': 'integer',
      'DECIMAL': 'numeric',
      'FLOAT': 'numeric',
      'DOUBLE': 'numeric',
      'VARCHAR': 'text',
      'TEXT': 'text',
      'CHAR': 'text',
      'DATE': 'date',
      'DATETIME': 'datetime',
      'TIMESTAMP': 'timestamp',
      'BOOLEAN': 'boolean',
      'BOOL': 'boolean'
    };

    return typeMap[sqlType.toUpperCase()] || 'text';
  }

  /**
   * Valida tipo de arquivo
   * @param {string} mimetype - Tipo MIME do arquivo
   * @param {string} filename - Nome do arquivo
   * @returns {string|null} Tipo do arquivo ou null se não suportado
   */
  validateFileType(mimetype, filename) {
    const extension = path.extname(filename).toLowerCase();
    
    // Verifica por extensão primeiro
    if (extension === '.csv') return 'csv';
    if (extension === '.xlsx' || extension === '.xls') return 'excel';
    if (extension === '.sql') return 'sql';
    if (extension === '.json') return 'json';

    // Verifica por MIME type
    for (const [type, mimes] of Object.entries(this.supportedTypes)) {
      if (mimes.includes(mimetype)) return type;
    }

    return null;
  }

  /**
   * Processa arquivo baseado no tipo usando buffer
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} fileName - Nome do arquivo
   * @param {string} fileType - Tipo do arquivo
   * @returns {Object} Resultado do processamento
   */
  async processFile(fileBuffer, fileName, fileType) {
    switch (fileType) {
      case 'csv':
        return await this.processCSV(fileBuffer, fileName);
      case 'excel':
        return await this.processExcel(fileBuffer, fileName);
      case 'sql':
        return await this.processSQL(fileBuffer, fileName);
      case 'json':
        return await this.processJSON(fileBuffer, fileName);
      default:
        throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
    }
  }
}

module.exports = FileProcessorService;
