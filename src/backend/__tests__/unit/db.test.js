jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(),
}));

describe('db error wrapping', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.DB_HOST = '147.79.86.63';
    process.env.DB_PORT = '3307';
    process.env.DB_NAME = 'bi';
    process.env.DB_CONNECT_TIMEOUT = '10000';
  });

  test('query converte ETIMEDOUT em DATABASE_UNAVAILABLE', async () => {
    const mysql = require('mysql2/promise');
    mysql.createPool.mockReturnValue({
      query: jest.fn().mockRejectedValue({ code: 'ETIMEDOUT' }),
      getConnection: jest.fn(),
    });

    const { query } = require('../../db');

    await expect(query('SELECT 1')).rejects.toMatchObject({
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
    });
  });

  test('getConnection converte ER_ACCESS_DENIED_ERROR em DATABASE_AUTH_FAILED', async () => {
    const mysql = require('mysql2/promise');
    mysql.createPool.mockReturnValue({
      query: jest.fn(),
      getConnection: jest.fn().mockRejectedValue({ code: 'ER_ACCESS_DENIED_ERROR' }),
    });

    const { getConnection } = require('../../db');

    await expect(getConnection()).rejects.toMatchObject({
      statusCode: 503,
      code: 'DATABASE_AUTH_FAILED',
    });
  });
});
