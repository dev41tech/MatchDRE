const { Router } = require('express');
const mappingService = require('../services/mappingService');
const validateTenant = require('../middleware/validateTenant');

const router = Router({ mergeParams: true });

/**
 * GET /api/v1/tenants/:tenantId/categories/mappings
 * Retorna todas as categorias do tenant com mapeamento atual.
 * O filtro "somente não mapeadas" é aplicado no frontend (V1).
 */
router.get('/mappings', validateTenant, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    console.log(`[route] GET categories/mappings tenant=${tenantId}`);
    const categorias = await mappingService.getCategories(tenantId);
    res.json({ tenant_id: tenantId, categorias });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tenants/:tenantId/categories/mappings/bulk-upsert
 * Body: { grupo_dre: string, categorias: [{ chave_categoria, nome_categoria }] }
 */
router.post('/mappings/bulk-upsert', validateTenant, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { grupo_dre, categorias } = req.body;

    const result = await mappingService.bulkUpsert(tenantId, grupo_dre, categorias);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/:chaveCategoria/mapping',
  validateTenant,
  async (req, res, next) => {
    try {
      const { tenantId, chaveCategoria } = req.params;

      const result = await mappingService.clearCategoryMapping(
        tenantId,
        chaveCategoria
      );

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
