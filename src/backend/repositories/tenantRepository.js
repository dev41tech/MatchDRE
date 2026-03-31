const { query } = require('../db');

/**
 * Retorna lista de tenant_ids distintos ordenados.
 * Fonte: bi.d_omie_categoria (tabela autoritativa enquanto não há tabela mestre de clientes).
 */
async function listTenants() {
  const [rows] = await query(
    `SELECT DISTINCT tenant_id
     FROM bi.d_omie_categoria
     ORDER BY tenant_id`
  );
  return rows.map(r => r.tenant_id);
}

/**
 * Verifica se um tenant existe em bi.d_omie_categoria.
 * Retorna true/false.
 */
async function tenantExists(tenantId) {
  const [rows] = await query(
    `SELECT 1
     FROM bi.d_omie_categoria
     WHERE tenant_id = ?
     LIMIT 1`,
    [tenantId]
  );
  return rows.length > 0;
}

module.exports = { listTenants, tenantExists };
