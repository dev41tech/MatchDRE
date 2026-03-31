/**
 * Testes de propriedade para lógica pura do bulk-upsert.
 * Não requerem banco de dados real.
 *
 * Cobrem:
 *   - P4: Grupos de Cálculo Nunca Permitidos
 *   - P8: Contadores Consistentes
 */

// Feature: mapeamento-dre

jest.mock('../../db', () => ({
  getConnection: jest.fn(),
  query: jest.fn(),
}));

jest.mock('../../repositories/mappingRepository', () => ({
  getCategories: jest.fn(),
  bulkUpsert: jest.fn(),
}));

const fc = require('fast-check');
const { getConnection } = require('../../db');
const mappingRepository = require('../../repositories/mappingRepository');
const mappingService    = require('../../services/mappingService');
const { GRUPOS_CALCULO, GRUPOS_SELECIONAVEIS } = require('../../constants/dreGroups');

const categoriaArb = fc.record({
  chave_categoria: fc.string({ minLength: 1, maxLength: 50 }),
  nome_categoria:  fc.string({ minLength: 1, maxLength: 100 }),
});

const categoriasArb = fc.array(categoriaArb, { minLength: 1, maxLength: 20 });

// Property 4: Grupos de Cálculo Nunca Persistidos
describe('P4 — Grupos de Cálculo Nunca Persistidos', () => {
  // Feature: mapeamento-dre, Property 4: Grupos de Cálculo Nunca Persistidos
  test('qualquer grupo de cálculo resulta em HTTP 422 e repositório não é chamado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...GRUPOS_CALCULO.map(g => g.codigo)),
        categoriasArb,
        async (grupoDre, categorias) => {
          mappingRepository.bulkUpsert.mockClear();

          await expect(
            mappingService.bulkUpsert('tenant_x', grupoDre, categorias)
          ).rejects.toMatchObject({ statusCode: 422, code: 'GRUPO_CALCULO_NAO_PERMITIDO' });

          // Repositório nunca deve ser chamado com grupo de cálculo
          expect(mappingRepository.bulkUpsert).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 8: Contadores do Bulk-Upsert são Consistentes
describe('P8 — Contadores do Bulk-Upsert são Consistentes', () => {
  // Feature: mapeamento-dre, Property 8: Contadores do Bulk-Upsert Consistentes
  test('processed_count = inserted + updated = N para qualquer payload válido', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...GRUPOS_SELECIONAVEIS.map(g => g.codigo)),
        categoriasArb,
        async (grupoDre, categorias) => {
          // Gera contadores realistas: inserted + updated = total
          const n         = categorias.length;
          const updated   = Math.floor(Math.random() * (n + 1));
          const inserted  = n - updated;

          const conn = {
            beginTransaction: jest.fn().mockResolvedValue(),
            commit:           jest.fn().mockResolvedValue(),
            rollback:         jest.fn().mockResolvedValue(),
            release:          jest.fn(),
          };
          getConnection.mockResolvedValue(conn);
          mappingRepository.bulkUpsert.mockResolvedValue({ inserted, updated });

          const result = await mappingService.bulkUpsert('tenant_x', grupoDre, categorias);

          // processed = inserted + updated
          expect(result.processed_count).toBe(result.inserted_count + result.updated_count);
          // processed = N (tamanho do payload)
          expect(result.processed_count).toBe(n);
        }
      ),
      { numRuns: 100 }
    );
  });
});
