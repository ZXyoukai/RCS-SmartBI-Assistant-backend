const { PrismaClient } = require('@prisma/client');
const FileProcessorService = require('../services/fileProcessorService');
const DatabaseConnectionService = require('../services/databaseConnectionService');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();
const fileProcessor = new FileProcessorService();
const dbConnection = new DatabaseConnectionService();

module.exports = {
  async createDatabase(req, res) {
    try {
      const { name, url, schema, description, type } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nome e tipo são obrigatórios.' 
        });
      }

      // Se schema não foi fornecido e há URL, tenta extrair automaticamente
      let finalSchema = schema;
      if (!schema && url && ['PostgreSQL', 'MySQL', 'SQLite'].includes(type)) {
        try {
          console.log('Tentando extrair schema automaticamente...');
          const extractedSchema = await dbConnection.extractSchema(type, url);
          finalSchema = JSON.stringify(extractedSchema);
          console.log('Schema extraído automaticamente com sucesso');
        } catch (error) {
          console.error('Erro ao extrair schema automaticamente:', error.message);
          return res.status(400).json({
            success: false,
            error: 'Não foi possível extrair o schema automaticamente. Forneça o schema manualmente ou use o endpoint /connect-database.',
            details: error.message
          });
        }
      }

      if (!finalSchema) {
        return res.status(400).json({ 
          success: false, 
          error: 'Schema é obrigatório. Use upload de arquivo ou conexão de banco para extração automática.' 
        });
      }

      console.log('Schema recebido/extraído:', typeof finalSchema === 'string' ? 'JSON string' : 'Object');

      // Validação do schema
      let schemaObj;
      try {
        schemaObj = typeof finalSchema === 'string' ? JSON.parse(finalSchema) : finalSchema;
        if (!schemaObj || typeof schemaObj !== 'object' || !Object.keys(schemaObj).length) {
          return res.status(400).json({ 
            success: false, 
            error: 'Schema deve ser um objeto JSON com ao menos uma tabela.' 
          });
        }
      } catch (e) {
        return res.status(400).json({ 
          success: false, 
          error: 'Schema inválido. Deve ser JSON válido.' 
        });
      }

      const db = await prisma.associated_databases.create({
        data: { 
          name, 
          url, 
          schema: JSON.stringify(schemaObj), 
          description, 
          type,
          metadata: JSON.stringify({
            createdVia: schema ? 'manual' : 'auto_extraction',
            createdAt: new Date()
          })
        }
      });

      res.status(201).json({
        success: true,
        message: 'Banco criado com sucesso',
        data: db
      });

    } catch (error) {
      console.error('Erro ao criar banco:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  },

  async listDatabases(req, res) {
    try {
      const dbs = await prisma.associated_databases.findMany();
      res.json(dbs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getDatabase(req, res) {
    try {
      const { id } = req.params;
      const db = await prisma.associated_databases.findUnique({ where: { id: Number(id) } });
      if (!db) return res.status(404).json({ error: 'Banco não encontrado.' });
      res.json(db);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateDatabase(req, res) {
    try {
      const { id } = req.params;
      const { name, url, schema, description, type } = req.body;
      
      // Validação do schema se fornecido
      if (schema) {
        let schemaObj;
        try {
          schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
          if (!schemaObj || typeof schemaObj !== 'object') {
            return res.status(400).json({ error: 'Schema deve ser um objeto JSON válido.' });
          }
        } catch (e) {
          return res.status(400).json({ error: 'Schema inválido. Deve ser JSON.' });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (url) updateData.url = url;
      if (schema) updateData.schema = JSON.stringify(typeof schema === 'string' ? JSON.parse(schema) : schema);
      if (description) updateData.description = description;
      if (type) updateData.type = type;

      const db = await prisma.associated_databases.update({
        where: { id: Number(id) },
        data: updateData
      });
      
      res.json(db);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Banco não encontrado.' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async deleteDatabase(req, res) {
    try {
      const { id } = req.params;
      await prisma.associated_databases.delete({ where: { id: Number(id) } });
      res.json({ success: true, message: 'Banco removido com sucesso.' });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Banco não encontrado.' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Upload e processamento de arquivo (CSV, Excel, SQL, JSON)
   */
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nenhum arquivo foi enviado' 
        });
      }

      const { name, description } = req.body;
      const file = req.file;

      // Valida tipo do arquivo
      const fileType = fileProcessor.validateFileType(file.mimetype, file.originalname);
      if (!fileType) {
        // Remove arquivo inválido
        await fs.unlink(file.path);
        return res.status(400).json({
          success: false,
          error: 'Tipo de arquivo não suportado. Formatos aceitos: CSV, Excel, SQL, JSON'
        });
      }

      // Processa o arquivo
      console.log(`Processando arquivo ${fileType}:`, file.originalname);
      const processResult = await fileProcessor.processFile(file.path, fileType);

      // Remove o arquivo temporário
      await fs.unlink(file.path);

      // Cria entrada no banco
      const dbName = name || path.parse(file.originalname).name;
      const db = await prisma.associated_databases.create({
        data: {
          name: dbName,
          type: processResult.type,
          url: null, // Arquivo uploadado não tem URL
          schema: JSON.stringify(processResult.schema),
          description: description || `Dados importados de ${processResult.type}: ${file.originalname}`,
          metadata: JSON.stringify({
            originalFilename: file.originalname,
            fileSize: file.size,
            uploadDate: new Date(),
            processedData: {
              totalRows: processResult.totalRows,
              totalSheets: processResult.totalSheets,
              sampleData: processResult.sampleData
            }
          })
        }
      });

      res.status(201).json({
        success: true,
        message: `Arquivo ${processResult.type} processado com sucesso`,
        data: {
          database: db,
          processInfo: {
            type: processResult.type,
            totalRows: processResult.totalRows,
            totalSheets: processResult.totalSheets,
            schema: processResult.schema,
            sampleData: processResult.sampleData
          }
        }
      });

    } catch (error) {
      console.error('Erro no upload de arquivo:', error);

      // Remove arquivo em caso de erro
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao remover arquivo:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Erro ao processar arquivo',
        details: error.message
      });
    }
  },

  /**
   * Testa conexão com banco de dados
   */
  async testConnection(req, res) {
    try {
      const { type, url } = req.body;

      if (!type || !url) {
        return res.status(400).json({
          success: false,
          error: 'Tipo e URL de conexão são obrigatórios'
        });
      }

      // Testa a conexão
      const testResult = await dbConnection.testConnection(type, url);

      if (testResult.success) {
        res.json({
          success: true,
          message: testResult.message,
          info: testResult.info
        });
      } else {
        res.status(400).json({
          success: false,
          error: testResult.error,
          details: testResult.details
        });
      }

    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao testar conexão',
        details: error.message
      });
    }
  },

  /**
   * Conecta e extrai schema de banco de dados
   */
  async connectDatabase(req, res) {
    try {
      const { name, type, url, description } = req.body;

      if (!name || !type || !url) {
        return res.status(400).json({
          success: false,
          error: 'Nome, tipo e URL são obrigatórios'
        });
      }

      // Testa conexão primeiro
      const testResult = await dbConnection.testConnection(type, url);
      if (!testResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Falha na conexão com o banco',
          details: testResult.error
        });
      }

      // Extrai schema
      console.log(`Extraindo schema do banco ${type}...`);
      const schema = await dbConnection.extractSchema(type, url);

      // Cria entrada no banco
      const db = await prisma.associated_databases.create({
        data: {
          name,
          type,
          url,
          schema: JSON.stringify(schema),
          description: description || `Banco ${type} conectado`,
          metadata: JSON.stringify({
            connectionInfo: testResult.info,
            connectionDate: new Date(),
            tablesCount: Object.keys(schema).length
          })
        }
      });

      res.status(201).json({
        success: true,
        message: `Banco ${type} conectado e schema extraído com sucesso`,
        data: {
          database: db,
          connectionInfo: testResult.info,
          schema: schema,
          tablesCount: Object.keys(schema).length
        }
      });

    } catch (error) {
      console.error('Erro ao conectar banco:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao conectar com o banco de dados',
        details: error.message
      });
    }
  },

  /**
   * Lista tipos de banco suportados
   */
  async getSupportedTypes(req, res) {
    try {
      const supportedTypes = {
        databases: [
          {
            type: 'PostgreSQL',
            description: 'Banco PostgreSQL',
            connectionExample: 'postgresql://user:password@host:port/database',
            features: ['Schema extraction', 'Query execution']
          },
          {
            type: 'MySQL',
            description: 'Banco MySQL/MariaDB',
            connectionExample: 'mysql://user:password@host:port/database',
            features: ['Schema extraction', 'Query execution']
          },
          {
            type: 'SQLite',
            description: 'Banco SQLite (arquivo local)',
            connectionExample: '/path/to/database.db',
            features: ['Schema extraction', 'Query execution']
          }
        ],
        files: [
          {
            type: 'CSV',
            description: 'Arquivo CSV',
            extensions: ['.csv'],
            maxSize: '50MB',
            features: ['Auto schema detection', 'Sample data preview']
          },
          {
            type: 'Excel',
            description: 'Planilha Excel',
            extensions: ['.xlsx', '.xls'],
            maxSize: '50MB',
            features: ['Multiple sheets', 'Auto schema detection']
          },
          {
            type: 'SQL',
            description: 'Script SQL',
            extensions: ['.sql'],
            maxSize: '50MB',
            features: ['Schema extraction from CREATE statements']
          },
          {
            type: 'JSON',
            description: 'Arquivo JSON',
            extensions: ['.json'],
            maxSize: '50MB',
            features: ['Auto schema detection', 'Nested object support']
          }
        ]
      };

      res.json({
        success: true,
        data: supportedTypes
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Visualiza preview dos dados de um banco
   */
  async previewData(req, res) {
    try {
      const { id } = req.params;
      const { table, limit = 10 } = req.query;

      const db = await prisma.associated_databases.findUnique({ 
        where: { id: Number(id) } 
      });

      if (!db) {
        return res.status(404).json({ 
          success: false, 
          error: 'Banco não encontrado.' 
        });
      }

      let previewData = {};

      // Se for arquivo uploadado, pega dados do metadata
      if (!db.url && db.metadata) {
        const metadata = JSON.parse(db.metadata);
        previewData = metadata.processedData?.sampleData || {};
      }
      // Se for conexão de banco, executa query de preview
      else if (db.url) {
        // Implementar preview de dados reais do banco conectado
        previewData = { message: 'Preview de dados de banco conectado em desenvolvimento' };
      }

      const schema = JSON.parse(db.schema);

      res.json({
        success: true,
        data: {
          database: {
            id: db.id,
            name: db.name,
            type: db.type
          },
          schema: schema,
          preview: previewData,
          tables: Object.keys(schema)
        }
      });

    } catch (error) {
      console.error('Erro no preview:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};
