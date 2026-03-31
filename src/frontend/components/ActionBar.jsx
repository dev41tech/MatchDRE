import React from 'react';

/**
 * Barra de ações: filtro, seletor de grupo DRE e botão salvar.
 *
 * Props:
 *   dreGroups      [{ codigo, nome }]     - grupos selecionáveis
 *   grupoDre       string|null            - grupo selecionado
 *   onSetDreGroup  (codigo|null) => void
 *   filtroAtivo    boolean
 *   onToggleFilter () => void
 *   selecionadas   Set<string>
 *   salvando       boolean
 *   onSave         () => void
 */
export default function ActionBar({
  dreGroups,
  grupoDre,
  onSetDreGroup,
  filtroAtivo,
  onToggleFilter,
  selecionadas,
  salvando,
  onSave,
}) {
  const salvarDesabilitado = selecionadas.size === 0 || !grupoDre || salvando;

  return (
    <div className="action-bar">
      {/* Toggle: somente não mapeadas */}
      <label>
        <input
          type="checkbox"
          checked={filtroAtivo}
          onChange={onToggleFilter}
          aria-label="Filtrar somente categorias não mapeadas"
        />
        Somente não mapeadas
      </label>

      {/* Seletor de Grupo DRE */}
      <select
        value={grupoDre || ''}
        onChange={e => onSetDreGroup(e.target.value || null)}
        aria-label="Selecionar Grupo DRE"
        disabled={salvando}
      >
        <option value="">— Selecione o Grupo DRE —</option>
        {dreGroups.map(g => (
          <option key={g.codigo} value={g.codigo}>
            {g.nome}
          </option>
        ))}
      </select>

      {/* Botão Salvar */}
      <button
        className="btn-save"
        onClick={onSave}
        disabled={salvarDesabilitado}
        aria-disabled={salvarDesabilitado}
        title={
          selecionadas.size === 0
            ? 'Selecione ao menos uma categoria'
            : !grupoDre
              ? 'Escolha um Grupo DRE'
              : 'Salvar mapeamentos'
        }
      >
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>

      {/* Contador de selecionadas */}
      {selecionadas.size > 0 && (
        <span className="selection-count">
          {selecionadas.size} selecionada(s)
        </span>
      )}
    </div>
  );
}
