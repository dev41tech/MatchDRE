/**
 * Testes unitários de mappingService com repositório mockado.
 * Cobrem validações, contadores e transações.
 */

jest.mock('../../db', () => ({
  getConnection: jest.fn(),
  query: jest.fn(),
}));

jest.mock('../../repositories/mappingRepository', () => ({
  getCategories: jest.fn(),
  bulkUpsert: jest.fn(),
  clearMapping: jest.fn(),
}));

const { getConnection } = require('../../db');
const mappingRepository = require('../../repositories/mappingRepository');
const mappingService = require('../../services/mappingService');

function makeConnection() {
  const conn = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
  };
  getConnection.mockResolvedValue(conn);
  return conn;
}

function makeBulkConnection(bulkResult = { inserted: 1, updated: 0 }) {
  const conn = makeConnection();
  mappingRepository.bulkUpsert.mockResolvedValue(bulkResult);
  return conn;
}

const VALID_CATEGORIAS = [
  { chave_categoria: '1.01', nome_categoria: 'Frete' },
  { chave_categoria: '1.02', nome_categoria: 'Pedágio' },
];

describe('mappingService.bulkUpsert - validações de grupo DRE', () => {
  test('aceita grupo selecionável RECEITA_BRUTA', async () => {
    makeBulkConnection({ inserted: 2, updated: 0 });

    const result = await mappingService.bulkUpsert('tenant_a', 'RECEITA_BRUTA', VALID_CATEGORIAS);

    expect(result.grupo_dre).toBe('RECEITA_BRUTA');
    expect(result.processed_count).toBe(2);
  });

  test.each([
    'RECEITA_LIQUIDA',
    'MARGEM_CONTRIBUICAO',
    'EBITDA',
    'RESULTADO_LIQUIDO_OPERACIONAL',
  ])('rejeita grupo de cálculo: %s com HTTP 422', async (grupoDre) => {
    await expect(
      mappingService.bulkUpsert('tenant_a', grupoDre, VALID_CATEGORIAS)
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'GRUPO_CALCULO_NAO_PERMITIDO',
    });
  });

  test('rejeita grupo desconhecido com HTTP 422', async () => {
    await expect(
      mappingService.bulkUpsert('tenant_a', 'GRUPO_INEXISTENTE', VALID_CATEGORIAS)
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});

describe('mappingService.bulkUpsert - validações de payload', () => {
  test('rejeita array vazio com HTTP 422', async () => {
    await expect(
      mappingService.bulkUpsert('tenant_a', 'RECEITA_BRUTA', [])
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  test('rejeita item com chave_categoria nula', async () => {
    const invalido = [{ chave_categoria: null, nome_categoria: 'Sem chave' }];

    await expect(
      mappingService.bulkUpsert('tenant_a', 'RECEITA_BRUTA', invalido)
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  test('rejeita item com chave_categoria string vazia', async () => {
    const invalido = [{ chave_categoria: '', nome_categoria: 'Sem chave' }];

    await expect(
      mappingService.bulkUpsert('tenant_a', 'RECEITA_BRUTA', invalido)
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
    });
  });
});

describe('mappingService.bulkUpsert - contadores', () => {
  test('processed_count = inserted + updated', async () => {
    makeBulkConnection({ inserted: 1, updated: 1 });

    const result = await mappingService.bulkUpsert('tenant_a', 'RECEITA_BRUTA', VALID_CATEGORIAS);

    expect(result.processed_count).toBe(result.inserted_count + result.updated_count);
  });

  test('processed_count = tamanho do payload', async () => {
    makeBulkConnection({ inserted: 2, updated: 0 });

    const result = await mappingService.bulkUpsert('tenant_a', 'RECEITA_BRUTA', VALID_CATEGORIAS);

    expect(result.processed_count).toBe(VALID_CATEGORIAS.length);
  });

  test('retorna tenant_id correto na resposta', async () => {
    makeBulkConnection({ inserted: 2, updated: 0 });

    const result = await mappingService.bulkUpsert('meu_tenant', 'RECEITA_BRUTA', VALID_CATEGORIAS);

    expect(result.tenant_id).toBe('meu_tenant');
  });
});

describe('mappingService.bulkUpsert - transação', () => {
  test('faz rollback em caso de erro no repositório', async () => {
    const conn = makeConnection();
    mappingRepository.bulkUpsert.mockRejectedValue(new Error('DB error'));

    await expect(
      mappingService.bulkUpsert('tenant_a', 'RECEITA_BRUTA', VALID_CATEGORIAS)
    ).rejects.toMatchObject({ code: 'PERSISTENCE_ERROR' });

    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});

describe('mappingService.clearCategoryMapping - transação', () => {
  test('remove mapeamento e retorna payload de sucesso', async () => {
    const conn = makeConnection();
    mappingRepository.clearMapping.mockResolvedValue({ deleted: true, affectedRows: 1 });

    const result = await mappingService.clearCategoryMapping('tenant_a', '1.02');

    expect(mappingRepository.clearMapping).toHaveBeenCalledWith('tenant_a', '1.02', conn);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
    expect(result).toEqual({
      tenant_id: 'tenant_a',
      chave_categoria: '1.02',
      cleared: true,
    });
  });

  test('faz rollback se a remoção falhar', async () => {
    const conn = makeConnection();
    mappingRepository.clearMapping.mockRejectedValue(new Error('DB error'));

    await expect(
      mappingService.clearCategoryMapping('tenant_a', '1.02')
    ).rejects.toThrow('DB error');

    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});
