const { Router } = require('express');
const tenantService   = require('../services/tenantService');
const dreGroupService = require('../services/dreGroupService');
const validateTenant  = require('../middleware/validateTenant');

const router = Router();

/**
 * GET /api/v1/tenants
 * Retorna lista de tenant_ids disponíveis.
 */
router.get('/', async (req, res, next) => {
  try {
    const tenants = await tenantService.listTenants();
    res.json({ tenants });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tenants/:tenantId/dre-groups
 * Retorna apenas grupos DRE selecionáveis para o tenant.
 * (A lista é estática; o tenant é validado pelo middleware.)
 */
router.get('/:tenantId/dre-groups', validateTenant, async (req, res, next) => {
  try {
    const groups = dreGroupService.getGroups();
    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
