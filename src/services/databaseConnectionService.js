const { Pool } = require('pg'); // PostgreSQL
const mysql = require('mysql2/promise'); // MySQL
const { Client: PgClient } = require('pg');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

class DatabaseConnectionService {
  constructor() {
    this.connectionTimeout = 10000; // 10 segundos
  }

  /**
   * Testa conexão com diferentes tipos de banco
   * @param {string} type - Tipo do banco (PostgreSQL, MySQL, SQLite, MSSQL)
   * @param {string} connectionString - String de conexão
   * @returns {Object} Resultado do teste
   */
  async testConnection(type, connectionString) {
    try {
      console.log(`Testando conexão ${type}:`, connectionString.replace(/\/\/.*:.*@/, '//***:***@'));

      switch (type.toLowerCase()) {
        case 'postgresql':
        case 'postgres':
          return await this.testPostgreSQL(connectionString);
        
        case 'mysql':
          return await this.testMySQL(connectionString);
        
        case 'sqlite':
          return await this.testSQLite(connectionString);
        
        default:
          throw new Error(`Tipo de banco não suportado: ${type}`);
      }
    } catch (error) {
      console.error(`Erro na conexão ${type}:`, error.message);
      return {
        success: false,
        error: error.message,
        details: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Testa conexão PostgreSQL
   */
  async testPostgreSQL(connectionString) {
    let client;
    try {
      client = new PgClient({
        connectionString,
        connectionTimeoutMillis: this.connectionTimeout,
        ssl: connectionString.includes('sslmode') ? { rejectUnauthorized: false } : false
      });

      await client.connect();
      
      // Teste básico
      const result = await client.query('SELECT version() as version, current_database() as database');
      await client.end();

      return {
        success: true,
        message: 'Conexão PostgreSQL bem-sucedida',
        info: {
          database: result.rows[0].database,
          version: result.rows[0].version.split(' ')[1] // Extrai apenas a versão
        }
      };
    } catch (error) {
      if (client) {
        try { await client.end(); } catch {}
      }
      throw error;
    }
  }

  /**
   * Testa conexão MySQL
   */
  async testMySQL(connectionString) {
    let connection;
    try {
      // Parse da connection string para MySQL
      const url = new URL(connectionString);
      const config = {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove a barra inicial
        connectTimeout: this.connectionTimeout,
        ssl: url.searchParams.get('ssl') === 'true' ? {} : false
      };

      connection = await mysql.createConnection(config);
      
      // Teste básico
      const [rows] = await connection.execute('SELECT VERSION() as version, DATABASE() as database');
      await connection.end();

      return {
        success: true,
        message: 'Conexão MySQL bem-sucedida',
        info: {
          database: rows[0].database,
          version: rows[0].version
        }
      };
    } catch (error) {
      if (connection) {
        try { await connection.end(); } catch {}
      }
      throw error;
    }
  }

  /**
   * Testa conexão SQLite
   */
  async testSQLite(filePath) {
    let db;
    try {
      // Remove prefixos como 'sqlite://' se presente
      const cleanPath = filePath.replace(/^sqlite:\/\//, '');
      
      db = await open({
        filename: cleanPath,
        driver: sqlite3.Database
      });

      // Teste básico
      const result = await db.get('SELECT sqlite_version() as version');
      await db.close();

      return {
        success: true,
        message: 'Conexão SQLite bem-sucedida',
        info: {
          database: cleanPath,
          version: result.version
        }
      };
    } catch (error) {
      if (db) {
        try { await db.close(); } catch {}
      }
      throw error;
    }
  }

  /**
   * Extrai schema básico do banco
   * @param {string} type - Tipo do banco
   * @param {string} connectionString - String de conexão
   * @returns {Object} Schema do banco
   */
  async extractSchema(type, connectionString) {
    try {
      switch (type.toLowerCase()) {
        case 'postgresql':
        case 'postgres':
          return await this.extractPostgreSQLSchema(connectionString);
        
        case 'mysql':
          return await this.extractMySQLSchema(connectionString);
        
        case 'sqlite':
          return await this.extractSQLiteSchema(connectionString);
        
        default:
          throw new Error(`Extração de schema não implementada para: ${type}`);
      }
    } catch (error) {
      throw new Error(`Erro ao extrair schema: ${error.message}`);
    }
  }

  /**
   * Extrai schema PostgreSQL
   */
  async extractPostgreSQLSchema(connectionString) {
    let client;
    try {
      client = new PgClient({
        connectionString,
        ssl: connectionString.includes('sslmode') ? { rejectUnauthorized: false } : false
      });

      await client.connect();

      // Query para obter informações das tabelas e colunas
      const schemaQuery = `
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          tc.constraint_type
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c 
          ON t.table_name = c.table_name
        LEFT JOIN information_schema.key_column_usage kcu 
          ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
        LEFT JOIN information_schema.table_constraints tc 
          ON kcu.constraint_name = tc.constraint_name
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position;
      `;

      const result = await client.query(schemaQuery);
      await client.end();

      return this.buildSchemaFromRows(result.rows);
    } catch (error) {
      if (client) {
        try { await client.end(); } catch {}
      }
      throw error;
    }
  }

  /**
   * Extrai schema MySQL
   */
  async extractMySQLSchema(connectionString) {
    let connection;
    try {
      const url = new URL(connectionString);
      const config = {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1)
      };

      connection = await mysql.createConnection(config);

      const schemaQuery = `
        SELECT 
          c.TABLE_NAME as table_name,
          c.COLUMN_NAME as column_name,
          c.DATA_TYPE as data_type,
          c.IS_NULLABLE as is_nullable,
          c.COLUMN_DEFAULT as column_default,
          tc.CONSTRAINT_TYPE as constraint_type
        FROM information_schema.COLUMNS c
        LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu 
          ON c.TABLE_NAME = kcu.TABLE_NAME AND c.COLUMN_NAME = kcu.COLUMN_NAME
        LEFT JOIN information_schema.TABLE_CONSTRAINTS tc 
          ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
        WHERE c.TABLE_SCHEMA = DATABASE()
        ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;
      `;

      const [rows] = await connection.execute(schemaQuery);
      await connection.end();

      return this.buildSchemaFromRows(rows);
    } catch (error) {
      if (connection) {
        try { await connection.end(); } catch {}
      }
      throw error;
    }
  }

  /**
   * Extrai schema SQLite
   */
  async extractSQLiteSchema(filePath) {
    let db;
    try {
      const cleanPath = filePath.replace(/^sqlite:\/\//, '');
      
      db = await open({
        filename: cleanPath,
        driver: sqlite3.Database
      });

      // Obter lista de tabelas
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
      const schema = {};

      for (const table of tables) {
        const columns = await db.all(`PRAGMA table_info(${table.name})`);
        const columnSchema = {};

        columns.forEach(col => {
          columnSchema[col.name] = {
            type: this.mapSQLiteType(col.type),
            nullable: !col.notnull,
            primaryKey: col.pk === 1,
            default: col.dflt_value,
            description: `Coluna ${col.name} da tabela ${table.name}`
          };
        });

        schema[table.name] = {
          columns: columnSchema,
          type: 'table',
          source: 'database_connection'
        };
      }

      await db.close();
      return schema;
    } catch (error) {
      if (db) {
        try { await db.close(); } catch {}
      }
      throw error;
    }
  }

  /**
   * Constrói schema a partir de rows
   */
  buildSchemaFromRows(rows) {
    const schema = {};
    
    rows.forEach(row => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = {
          columns: {},
          type: 'table',
          source: 'database_connection'
        };
      }

      if (row.column_name) {
        schema[row.table_name].columns[row.column_name] = {
          type: this.mapDatabaseType(row.data_type),
          nullable: row.is_nullable === 'YES',
          primaryKey: row.constraint_type === 'PRIMARY KEY',
          default: row.column_default,
          description: `Coluna ${row.column_name} da tabela ${row.table_name}`
        };
      }
    });

    return schema;
  }

  /**
   * Mapeia tipos de banco para tipos genéricos
   */
  mapDatabaseType(dbType) {
    const typeMap = {
      // PostgreSQL
      'integer': 'integer',
      'bigint': 'integer',
      'smallint': 'integer',
      'numeric': 'numeric',
      'real': 'numeric',
      'double precision': 'numeric',
      'character varying': 'text',
      'varchar': 'text',
      'text': 'text',
      'char': 'text',
      'date': 'date',
      'timestamp': 'timestamp',
      'timestamp without time zone': 'timestamp',
      'boolean': 'boolean',
      
      // MySQL
      'int': 'integer',
      'tinyint': 'integer',
      'decimal': 'numeric',
      'float': 'numeric',
      'double': 'numeric',
      'datetime': 'datetime',
      'tinyint(1)': 'boolean'
    };

    return typeMap[dbType.toLowerCase()] || 'text';
  }

  /**
   * Mapeia tipos SQLite
   */
  mapSQLiteType(sqliteType) {
    const typeMap = {
      'INTEGER': 'integer',
      'REAL': 'numeric',
      'TEXT': 'text',
      'BLOB': 'blob',
      'NUMERIC': 'numeric'
    };

    return typeMap[sqliteType.toUpperCase()] || 'text';
  }
}

module.exports = DatabaseConnectionService;
