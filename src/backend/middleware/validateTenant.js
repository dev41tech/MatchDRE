const tenantRepository = require('../repositories/tenantRepository');

/**
 * Middleware que valida se o tenant_id da URL existe em bi.d_omie_categoria.
 * Deve ser aplicado em todas as rotas /tenants/:tenantId/*.
 */
async function validateTenant(req, res, next) {
  const { tenantId } = req.params;

  if (!tenantId || tenantId.trim() === '') {
    return res.status(400).json({
      error: {
        code: 'TENANT_ID_REQUIRED',
        message: 'O tenant_id é obrigatório.',
        details: [],
      },
    });
  }

  try {
    const exists = await tenantRepository.tenantExists(tenantId);
    if (!exists) {
      return res.status(404).json({
        error: {
          code: 'TENANT_NOT_FOUND',
          message: `Tenant '${tenantId}' não encontrado.`,
          details: [],
        },
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = validateTenant;
