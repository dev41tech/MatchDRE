const { query, getConnection } = require('../db');
const { NOME_POR_CODIGO } = require('../constants/dreGroups');

/**
 * Retorna categorias do tenant com mapeamento atual (LEFT JOIN) e enriquecimento
 * opcional de f_movimentacao (quantidade_uso, ultima_data_uso).
 */
async function getCategories(tenantId) {
  const sql = `
    SELECT
      cat.codigo_categoria                    AS chave_categoria,
      cat.codigo_categoria                    AS codigo_categoria,
      cat.descricao_categoria                 AS nome_categoria,
      map.grupo_dre                           AS grupo_dre,
      map.atualizado_em                       AS mapeado_em
    FROM bi.d_omie_categoria cat
    LEFT JOIN bi.map_categoria_grupo_dre map
      ON map.tenant_id      = cat.tenant_id
      AND map.chave_categoria = cat.codigo_categoria
    WHERE cat.tenant_id = ?
    ORDER BY cat.descricao_categoria ASC, cat.codigo_categoria ASC
  `;

  const [rows] = await query(sql, [tenantId]);

  return rows.map(row => ({
    chave_categoria: row.chave_categoria,
    codigo_categoria: row.codigo_categoria,
    nome_categoria: row.nome_categoria,
    grupo_dre: row.grupo_dre || null,
    grupo_dre_nome: row.grupo_dre ? (NOME_POR_CODIGO[row.grupo_dre] || row.grupo_dre) : null,
    status: row.grupo_dre ? 'MAPEADA' : 'NAO_MAPEADA',
    quantidade_uso: null,
    ultima_data_uso: null,
    mapeado_em: row.mapeado_em || null,
  }));
}

/**
 * Remove o mapeamento de uma única categoria para o tenant.
 */
async function clearMapping(tenantId, chaveCategoria, connection) {
  const [result] = await connection.query(
    `DELETE FROM bi.map_categoria_grupo_dre
     WHERE tenant_id = ?
       AND chave_categoria = ?`,
    [tenantId, chaveCategoria]
  );

  return {
    deleted: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
}

/**
 * Remove TODOS os mapeamentos do tenant.
 * Usado pela ação "Limpar todas" no frontend.
 * Recebe uma conexão com transação já aberta.
 */
async function clearAllMappings(tenantId, connection) {
  const [result] = await connection.query(
    `DELETE FROM bi.map_categoria_grupo_dre WHERE tenant_id = ?`,
    [tenantId]
  );

  return { deleted: result.affectedRows };
}

/**
 * Executa bulk-upsert idempotente dentro de uma transação fornecida externamente.
 *
 * Estratégia:
 *  1. Pré-consulta quais chaves já existem → determina inserted vs updated
 *  2. INSERT em lote com ON DUPLICATE KEY UPDATE (single query, all-or-nothing)
 */
async function bulkUpsert(tenantId, grupoDre, categorias, connection) {
  const chaves = categorias.map(c => c.chave_categoria);

  const [existingRows] = await connection.query(
    `SELECT chave_categoria
     FROM bi.map_categoria_grupo_dre
     WHERE tenant_id = ?
       AND chave_categoria IN (?)`,
    [tenantId, chaves]
  );
  const existingSet = new Set(existingRows.map(r => r.chave_categoria));

  const values = categorias.map(c => [
    tenantId,
    c.chave_categoria,
    c.nome_categoria,
    grupoDre,
  ]);

  await connection.query(
    `INSERT INTO bi.map_categoria_grupo_dre
       (tenant_id, chave_categoria, nome_categoria, grupo_dre)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       grupo_dre      = VALUES(grupo_dre),
       nome_categoria = VALUES(nome_categoria),
       atualizado_em  = CURRENT_TIMESTAMP`,
    [values]
  );

  const updated  = categorias.filter(c => existingSet.has(c.chave_categoria)).length;
  const inserted = categorias.length - updated;

  return { inserted, updated };
}

module.exports = { getCategories, bulkUpsert, clearMapping, clearAllMappings };
