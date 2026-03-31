const { query, getConnection } = require('../db');
const { NOME_POR_CODIGO } = require('../constants/dreGroups');

/**
 * Retorna categorias do tenant com mapeamento atual (LEFT JOIN) e enriquecimento
 * opcional de f_movimentacao (quantidade_uso, ultima_data_uso).
 *
 * NOTA: O JOIN com f_movimentacao assume as colunas:
 *   - f_movimentacao.tenant_id
 *   - f_movimentacao.codigo_categoria
 *   - f_movimentacao.data_lancamento  ← ajuste conforme schema real
 * Se as colunas diferirem, edite o subquery de enriquecimento abaixo.
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

async function clearMapping(tenantId, chaveCategoria, connection) {
  const [result] = await connection.query(
    `
      DELETE FROM bi.map_categoria_grupo_dre
      WHERE tenant_id = ?
        AND chave_categoria = ?
    `,
    [tenantId, chaveCategoria]
  );

  return {
    deleted: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
}

/**
 * Executa bulk-upsert idempotente dentro de uma transação fornecida externamente.
 *
 * Estratégia:
 *  1. Pré-consulta quais chaves já existem → determina inserted vs updated
 *  2. INSERT em lote com ON DUPLICATE KEY UPDATE (single query, all-or-nothing)
 *
 * @param {string}     tenantId   - tenant isolado
 * @param {string}     grupoDre   - código do grupo DRE
 * @param {Array}      categorias - [{ chave_categoria, nome_categoria }]
 * @param {Connection} connection - conexão mysql2 com transação aberta
 * @returns {{ inserted: number, updated: number }}
 */
async function bulkUpsert(tenantId, grupoDre, categorias, connection) {
  const chaves = categorias.map(c => c.chave_categoria);

  // 1. Descobre quais chaves já existem para derivar contadores
  const [existingRows] = await connection.query(
    `SELECT chave_categoria
     FROM bi.map_categoria_grupo_dre
     WHERE tenant_id = ?
       AND chave_categoria IN (?)`,
    [tenantId, chaves]
  );
  const existingSet = new Set(existingRows.map(r => r.chave_categoria));

  // 2. Monta array de valores para insert em lote
  // Formato: [[tenant_id, chave_categoria, nome_categoria, grupo_dre], ...]
  const values = categorias.map(c => [
    tenantId,
    c.chave_categoria,
    c.nome_categoria,
    grupoDre,
  ]);

  // 3. Insert em lote com ON DUPLICATE KEY UPDATE (idempotente)
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

  // 4. Deriva contadores por interseção com pré-consulta
  const updated  = categorias.filter(c => existingSet.has(c.chave_categoria)).length;
  const inserted = categorias.length - updated;

  return { inserted, updated };
}

module.exports = { getCategories, bulkUpsert, clearMapping };
