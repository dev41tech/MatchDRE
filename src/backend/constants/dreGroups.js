/**
 * Grupos DRE selecionáveis pelo usuário.
 * Apenas estes podem ser persistidos na tabela bi.map_categoria_dre.
 */
const GRUPOS_SELECIONAVEIS = [
  { codigo: 'RECEITA_BRUTA',              nome: 'RECEITA BRUTA' },
  { codigo: 'IMPOSTOS_RECEITA_BRUTA',     nome: 'IMPOSTOS SOBRE RECEITA BRUTA' },
  { codigo: 'CUSTO_OPERACIONAL_TOTAL',    nome: 'CUSTO OPERACIONAL TOTAL' },
  { codigo: 'CUSTO_ADMINISTRATIVO_TOTAL', nome: 'CUSTO ADMINISTRATIVO TOTAL' },
  { codigo: 'OUTRAS_DESPESAS_TOTAIS',     nome: 'OUTRAS DESPESAS TOTAIS' },
  { codigo: 'OUTRAS_RECEITAS_TOTAIS',     nome: 'OUTRAS RECEITAS TOTAIS' },
];

/**
 * Grupos de cálculo: derivados, nunca podem ser persistidos via API.
 * Uma requisição com qualquer destes códigos deve ser rejeitada com HTTP 422.
 */
const GRUPOS_CALCULO = [
  { codigo: 'RECEITA_LIQUIDA',               nome: 'RECEITA LÍQUIDA' },
  { codigo: 'MARGEM_CONTRIBUICAO',           nome: 'MARGEM DE CONTRIBUIÇÃO' },
  { codigo: 'EBITDA',                        nome: 'GERADOR DE CAIXA (EBITDA)' },
  { codigo: 'RESULTADO_LIQUIDO_OPERACIONAL', nome: 'RESULTADO LÍQUIDO OPERACIONAL' },
];

/** Set de códigos selecionáveis para lookup O(1). */
const CODIGOS_SELECIONAVEIS = new Set(GRUPOS_SELECIONAVEIS.map(g => g.codigo));

/** Set de códigos de cálculo para lookup O(1). */
const CODIGOS_CALCULO = new Set(GRUPOS_CALCULO.map(g => g.codigo));

/** Mapa codigo → nome para enriquecer respostas. */
const NOME_POR_CODIGO = Object.fromEntries(
  [...GRUPOS_SELECIONAVEIS, ...GRUPOS_CALCULO].map(g => [g.codigo, g.nome])
);

module.exports = {
  GRUPOS_SELECIONAVEIS,
  GRUPOS_CALCULO,
  CODIGOS_SELECIONAVEIS,
  CODIGOS_CALCULO,
  NOME_POR_CODIGO,
};
