require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_CONNECT_TIMEOUT = parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10);

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: DB_CONNECT_TIMEOUT,
  timezone: 'Z',
});

function wrapDatabaseError(err) {
  const connectivityErrors = new Set([
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'PROTOCOL_CONNECTION_LOST',
  ]);

  if (connectivityErrors.has(err.code)) {
    const wrapped = new Error(
      `Nao foi possivel conectar ao banco MySQL em ${DB_HOST}:${DB_PORT}. Verifique DB_HOST, DB_PORT, firewall e se o banco esta acessivel.`
    );
    wrapped.statusCode = 503;
    wrapped.code = 'DATABASE_UNAVAILABLE';
    wrapped.details = [
      { field: 'DB_HOST', message: `Destino configurado: ${DB_HOST}:${DB_PORT}` },
      { field: 'DB_CONNECT_TIMEOUT', message: `Timeout atual: ${DB_CONNECT_TIMEOUT}ms` },
    ];
    wrapped.cause = err;
    return wrapped;
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    const wrapped = new Error('Credenciais do MySQL invalidas. Verifique DB_USER e DB_PASSWORD.');
    wrapped.statusCode = 503;
    wrapped.code = 'DATABASE_AUTH_FAILED';
    wrapped.details = [
      { field: 'DB_USER', message: 'Falha de autenticacao ao abrir conexao com o banco.' },
    ];
    wrapped.cause = err;
    return wrapped;
  }

  if (err.code === 'ER_BAD_DB_ERROR') {
    const wrapped = new Error(`O banco "${process.env.DB_NAME}" nao foi encontrado.`);
    wrapped.statusCode = 503;
    wrapped.code = 'DATABASE_NOT_FOUND';
    wrapped.details = [
      { field: 'DB_NAME', message: 'O schema configurado nao existe no servidor MySQL.' },
    ];
    wrapped.cause = err;
    return wrapped;
  }

  return err;
}

/**
 * Executa uma query no pool (sem transacao).
 * Uso: const [rows] = await query('SELECT ...', [params]);
 */
async function query(sql, params) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    throw wrapDatabaseError(err);
  }
}

/**
 * Retorna uma conexao do pool (para transacoes manuais).
 * Lembrar de chamar connection.release() ao final.
 */
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (err) {
    throw wrapDatabaseError(err);
  }
}

module.exports = { query, getConnection, wrapDatabaseError };
