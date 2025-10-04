const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const { Client: PgClient } = require('pg');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const mariadb = require('mariadb');
const { URL } = require('url');


async function getSchemaFromURL(url, type) {

  // Implementação da lógica para obter o schema com base na URL e tipo do banco de dados
}

async function testConnection(url) {
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (err) {
    await pool.end();
    throw err;
  }
}

async function executeReadOnlyQuery(url, query) {
  // if (!/^\s*SELECT/i.test(query)) throw new Error('Apenas queries SELECT são permitidas');
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  console.log('Executando query:', query);
  console.log('url:', url);
  try {
    const result = await pool.query(query);
    await pool.end();
    return result.rows;
  } catch (err) {
    await pool.end();
    throw err;
  }
}


async function getSchema(url, type) {
  if (!url || !type) {
    throw new Error('URL e tipo do banco são obrigatórios.');
  }

  switch (type.toLowerCase()) {
    case 'mysql':
    case 'mariadb':
      return await getMySQLorMariaDBSchema(url);

    case 'postgres':
    case 'postgresql':
      return await getPostgresSchema(url);

    case 'sqlite':
      return await getSQLiteSchema(url);

    default:
      throw new Error(`Tipo de banco não suportado: ${type}`);
  }
}

async function getMySQLorMariaDBSchema(dbUrl) {
  const parsed = new URL(dbUrl);
  const config = {
    host: parsed.hostname,
    port: parsed.port || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace('/', ''),
  };

  const conn = await mysql.createConnection(config);

  const [tables] = await conn.query(`SHOW TABLES`);
  const schema = {};

  for (let row of tables) {
    const tableName = Object.values(row)[0];
    const [columns] = await conn.query(`SHOW COLUMNS FROM \`${tableName}\``);
    schema[tableName] = columns.map(col => ({
      name: col.Field,
      type: col.Type,
      nullable: col.Null === 'YES'
    }));
  }

  await conn.end();
  return schema;
}

async function getPostgresSchema(dbUrl) {
  const client = new PgClient({ connectionString: dbUrl });
  await client.connect();

  const res = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  const schema = {};
  for (const row of res.rows) {
    if (!schema[row.table_name]) {
      schema[row.table_name] = [];
    }
    schema[row.table_name].push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES'
    });
  }

  await client.end();
  return schema;
}

async function getSQLiteSchema(filePath) {
  const db = await open({
    filename: filePath.replace('file:', ''),
    driver: sqlite3.Database
  });

  const tables = await db.all(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
  `);

  const schema = {};

  for (const { name: tableName } of tables) {
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    schema[tableName] = columns.map(col => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0
    }));
  }

  await db.close();
  return schema;
}

module.exports = { testConnection, executeReadOnlyQuery, getSchema };
