const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Pool } = require('pg');

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
  if (!/^\s*SELECT/i.test(query)) throw new Error('Apenas queries SELECT são permitidas');
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    const result = await pool.query(query);
    await pool.end();
    return result.rows;
  } catch (err) {
    await pool.end();
    throw err;
  }
}

module.exports = { testConnection, executeReadOnlyQuery };
