/**
 * Testes de propriedade para lógica pura de categorias.
 * Não requerem banco de dados real.
 *
 * Cobrem:
 *   - P5: Determinismo da Chave_Categoria (identidade: chave === codigo)
 *   - P7: Filtro de Não Mapeadas é Subconjunto Correto
 */

// Feature: mapeamento-dre

const fc = require('fast-check');

// Função pura que deriva chave_categoria (regra: identidade com codigo_categoria)
function derivarChave(codigoCategoria) {
  return codigoCategoria;
}

// Função pura que aplica o filtro "somente não mapeadas"
function filtrarNaoMapeadas(categorias) {
  return categorias.filter(c => c.status === 'NAO_MAPEADA');
}

// Property 5: Determinismo da Chave_Categoria
describe('P5 — Identidade da Chave_Categoria', () => {
  // Feature: mapeamento-dre, Property 5: Identidade da Chave_Categoria
  test('derivarChave(codigo) === codigo para qualquer codigo não nulo', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (codigo) => {
          const chave = derivarChave(codigo);
          // Identidade: chave deve ser igual ao codigo
          expect(chave).toBe(codigo);
          // Nunca retorna nulo ou vazio quando input é não nulo
          expect(chave).not.toBeNull();
          expect(chave.length).toBeGreaterThan(0);
          // Determinismo: chamadas repetidas retornam o mesmo valor
          expect(derivarChave(codigo)).toBe(derivarChave(codigo));
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Property 7: Filtro é Subconjunto Correto
describe('P7 — Filtro de Não Mapeadas é Subconjunto Correto', () => {
  // Feature: mapeamento-dre, Property 7: Filtro é Subconjunto Correto
  const categoriaArb = fc.record({
    chave_categoria: fc.string({ minLength: 1 }),
    nome_categoria:  fc.string({ minLength: 1 }),
    status: fc.constantFrom('MAPEADA', 'NAO_MAPEADA'),
    grupo_dre: fc.option(fc.string({ minLength: 1 })),
  });

  test('filtradas.every(c => status === NAO_MAPEADA) e filtradas.length <= total', () => {
    fc.assert(
      fc.property(
        fc.array(categoriaArb, { minLength: 0, maxLength: 50 }),
        (categorias) => {
          const filtradas = filtrarNaoMapeadas(categorias);

          // Todas as filtradas têm status NAO_MAPEADA
          expect(filtradas.every(c => c.status === 'NAO_MAPEADA')).toBe(true);

          // Subconjunto: nunca maior que o total
          expect(filtradas.length).toBeLessThanOrEqual(categorias.length);

          // Completude: nenhuma NAO_MAPEADA é excluída do filtro
          const naoMapeadasTotal = categorias.filter(c => c.status === 'NAO_MAPEADA').length;
          expect(filtradas.length).toBe(naoMapeadasTotal);
        }
      ),
      { numRuns: 200 }
    );
  });
});
