const {
  GRUPOS_SELECIONAVEIS,
  GRUPOS_CALCULO,
  CODIGOS_SELECIONAVEIS,
  CODIGOS_CALCULO,
  NOME_POR_CODIGO,
} = require('../../constants/dreGroups');

describe('dreGroups — constantes', () => {
  test('GRUPOS_SELECIONAVEIS tem 6 itens', () => {
    expect(GRUPOS_SELECIONAVEIS).toHaveLength(6);
  });

  test('GRUPOS_CALCULO tem 4 itens', () => {
    expect(GRUPOS_CALCULO).toHaveLength(4);
  });

  test('RECEITA_BRUTA está em CODIGOS_SELECIONAVEIS', () => {
    expect(CODIGOS_SELECIONAVEIS.has('RECEITA_BRUTA')).toBe(true);
  });

  test.each([
    'RECEITA_BRUTA',
    'IMPOSTOS_RECEITA_BRUTA',
    'CUSTO_OPERACIONAL_TOTAL',
    'CUSTO_ADMINISTRATIVO_TOTAL',
    'OUTRAS_DESPESAS_TOTAIS',
    'OUTRAS_RECEITAS_TOTAIS',
  ])('%s está em CODIGOS_SELECIONAVEIS', (codigo) => {
    expect(CODIGOS_SELECIONAVEIS.has(codigo)).toBe(true);
  });

  test.each([
    'RECEITA_LIQUIDA',
    'MARGEM_CONTRIBUICAO',
    'EBITDA',
    'RESULTADO_LIQUIDO_OPERACIONAL',
  ])('%s está em CODIGOS_CALCULO', (codigo) => {
    expect(CODIGOS_CALCULO.has(codigo)).toBe(true);
  });

  test('grupos selecionáveis não aparecem em CODIGOS_CALCULO', () => {
    GRUPOS_SELECIONAVEIS.forEach(g => {
      expect(CODIGOS_CALCULO.has(g.codigo)).toBe(false);
    });
  });

  test('grupos de cálculo não aparecem em CODIGOS_SELECIONAVEIS', () => {
    GRUPOS_CALCULO.forEach(g => {
      expect(CODIGOS_SELECIONAVEIS.has(g.codigo)).toBe(false);
    });
  });

  test('NOME_POR_CODIGO resolve RECEITA_BRUTA corretamente', () => {
    expect(NOME_POR_CODIGO['RECEITA_BRUTA']).toBe('RECEITA BRUTA');
  });
});
