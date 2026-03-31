const tenantRepository = require('../repositories/tenantRepository');

/**
 * Lista todos os tenants disponíveis.
 * @returns {Promise<string[]>}
 */
async function listTenants() {
  const tenants = await tenantRepository.listTenants();
  return tenants;
}

module.exports = { listTenants };
