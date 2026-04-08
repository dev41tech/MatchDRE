const mappingRepository = require('../repositories/mappingRepository');
const { CODIGOS_SELECIONAVEIS, CODIGOS_CALCULO } = require('../constants/dreGroups');
const { getConnection } = require('../db');

/**
 * Retorna categorias do tenant com seus mapeamentos atuais.
 */
async function getCategories(tenantId) {
  console.log(`[mappingService] Carregando categorias para tenant: ${tenantId}`);
  const categorias = await mappingRepository.getCategories(tenantId);
  console.log(`[mappingService] tenant=${tenantId} | categorias retornadas: ${categorias.length}`);
  return categorias;
}

/**
 * Remove o mapeamento de uma única categoria para o tenant.
 */
async function clearCategoryMapping(tenantId, chaveCategoria) {
  if (!tenantId) {
    const error = new Error('tenant_id é obrigatório');
    error.status = 400;
    error.code = 'INVALID_TENANT';
    throw error;
  }

  if (!chaveCategoria) {
    const error = new Error('chave_categoria é obrigatória');
    error.status = 400;
    error.code = 'INVALID_CATEGORY_KEY';
    throw error;
  }

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const result = await mappingRepository.clearMapping(
      tenantId,
      chaveCategoria,
      connection
    );

    await connection.commit();

    return {
      tenant_id: tenantId,
      chave_categoria: chaveCategoria,
      cleared: result.deleted,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Remove TODOS os mapeamentos do tenant atual.
 * Executa em transação atômica.
 */
async function clearAllMappings(tenantId) {
  if (!tenantId) {
    const error = new Error('tenant_id é obrigatório');
    error.statusCode = 400;
    error.code = 'INVALID_TENANT';
    throw error;
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const result = await mappingRepository.clearAllMappings(tenantId, connection);
    await connection.commit();

    console.log(`[mappingService] clearAllMappings tenant=${tenantId} | deleted=${result.deleted}`);

    return { tenant_id: tenantId, deleted_count: result.deleted };
  } catch (err) {
    await connection.rollback();
    console.error(`[mappingService] Erro em clearAllMappings tenant=${tenantId}:`, err);
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Executa bulk-upsert idempotente.
 */
async function bulkUpsert(tenantId, grupoDre, categorias) {
  if (CODIGOS_CALCULO.has(grupoDre)) {
    const err = new Error(`Grupo '${grupoDre}' é de cálculo e não pode ser persistido.`);
    err.statusCode = 422;
    err.code = 'GRUPO_CALCULO_NAO_PERMITIDO';
    throw err;
  }

  if (!CODIGOS_SELECIONAVEIS.has(grupoDre)) {
    const err = new Error(`Grupo '${grupoDre}' não é um código válido.`);
    err.statusCode = 422;
    err.code = 'GRUPO_INVALIDO';
    throw err;
  }

  if (!Array.isArray(categorias) || categorias.length === 0) {
    const err = new Error('O array de categorias não pode ser vazio.');
    err.statusCode = 422;
    err.code = 'VALIDATION_ERROR';
    err.details = [{ field: 'categorias', message: 'Deve conter ao menos uma categoria.' }];
    throw err;
  }

  const invalidas = categorias
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !c.chave_categoria || c.chave_categoria.trim() === '');

  if (invalidas.length > 0) {
    const err = new Error('Uma ou mais categorias estão sem chave_categoria.');
    err.statusCode = 422;
    err.code = 'VALIDATION_ERROR';
    err.details = invalidas.map(({ i }) => ({
      field: `categorias[${i}].chave_categoria`,
      message: 'chave_categoria é obrigatória e não pode ser nula.',
    }));
    throw err;
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    console.log(
      `[mappingService] bulk-upsert tenant=${tenantId} | grupo=${grupoDre} | qtd=${categorias.length}`
    );

    const { inserted, updated } = await mappingRepository.bulkUpsert(
      tenantId,
      grupoDre,
      categorias,
      connection
    );

    await connection.commit();

    return {
      tenant_id:       tenantId,
      grupo_dre:       grupoDre,
      requested_count: categorias.length,
      processed_count: inserted + updated,
      inserted_count:  inserted,
      updated_count:   updated,
    };
  } catch (err) {
    await connection.rollback();
    console.error(`[mappingService] Erro no bulk-upsert tenant=${tenantId}:`, err);

    if (!err.statusCode) {
      const wrapped = new Error('Falha ao persistir mapeamentos no banco de dados.');
      wrapped.statusCode = 500;
      wrapped.code = 'PERSISTENCE_ERROR';
      wrapped.cause = err;
      throw wrapped;
    }
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { getCategories, bulkUpsert, clearCategoryMapping, clearAllMappings };
