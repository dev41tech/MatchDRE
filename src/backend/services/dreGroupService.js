const { GRUPOS_SELECIONAVEIS } = require('../constants/dreGroups');

/**
 * Retorna apenas os grupos DRE selecionáveis (sem consulta ao banco).
 * Grupos de cálculo são omitidos intencionalmente.
 */
function getGroups() {
  return GRUPOS_SELECIONAVEIS;
}

module.exports = { getGroups };
