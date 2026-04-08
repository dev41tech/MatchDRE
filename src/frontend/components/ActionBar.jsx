import React, { useState } from 'react';

function IconSave() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function IconWarning() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/**
 * Barra de ações: filtro, seletor de grupo DRE, salvar e limpar todas.
 * Fica sticky ao rolar a página (via .action-bar-sticky no App.jsx).
 *
 * Props:
 *   dreGroups       [{ codigo, nome }]
 *   grupoDre        string|null
 *   onSetDreGroup   (codigo|null) => void
 *   filtroAtivo     boolean
 *   onToggleFilter  () => void
 *   selecionadas    Set<string>
 *   salvando        boolean
 *   onSave          () => void
 *   onClearAll      () => void         — limpar todos os mapeamentos
 *   temMapeamentos  boolean            — habilita o botão "Limpar todas"
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
  onClearAll,
  temMapeamentos,
}) {
  const [confirmandoClearAll, setConfirmandoClearAll] = useState(false);

  const salvarDesabilitado = selecionadas.size === 0 || !grupoDre || salvando;

  function handleConfirmClearAll() {
    setConfirmandoClearAll(false);
    onClearAll();
  }

  return (
    <div className="action-bar">
      {/* Linha principal */}
      <div className="action-bar-row">
        {/* Toggle: somente não mapeadas */}
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={filtroAtivo}
            onChange={onToggleFilter}
            aria-label="Filtrar somente categorias não mapeadas"
          />
          <span>Somente não mapeadas</span>
        </label>

        <div className="action-bar-divider" />

        {/* Seletor de Grupo DRE */}
        <select
          className="dre-select"
          value={grupoDre || ''}
          onChange={e => onSetDreGroup(e.target.value || null)}
          aria-label="Selecionar Grupo DRE"
          disabled={salvando}
        >
          <option value="">— Selecione o Grupo DRE —</option>
          {dreGroups.map(g => (
            <option key={g.codigo} value={g.codigo}>{g.nome}</option>
          ))}
        </select>

        {/* Botão Salvar */}
        <button
          className="btn-primary"
          onClick={onSave}
          disabled={salvarDesabilitado}
          aria-disabled={salvarDesabilitado}
          title={
            selecionadas.size === 0 ? 'Selecione ao menos uma categoria'
            : !grupoDre ? 'Escolha um Grupo DRE'
            : 'Salvar mapeamentos'
          }
        >
          <IconSave />
          <span>{salvando ? 'Salvando…' : 'Salvar'}</span>
        </button>

        <div className="action-bar-divider" />

        {/* Botão Limpar todas */}
        <button
          className="btn-danger-ghost"
          onClick={() => setConfirmandoClearAll(true)}
          disabled={!temMapeamentos || salvando || confirmandoClearAll}
          title={!temMapeamentos ? 'Não há mapeamentos para remover' : 'Remover todos os mapeamentos do cliente'}
        >
          <IconTrash />
          <span>Limpar todas</span>
        </button>

        {/* Contador de selecionadas */}
        {selecionadas.size > 0 && (
          <span className="selection-count">
            {selecionadas.size} selecionada{selecionadas.size > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Banner de confirmação — Limpar todas */}
      {confirmandoClearAll && (
        <div className="confirm-banner" role="alert">
          <IconWarning />
          <span>
            Remover <strong>todos</strong> os mapeamentos do cliente atual?
            {' '}Esta ação não pode ser desfeita.
          </span>
          <div className="confirm-banner-actions">
            <button
              className="btn-confirm-yes"
              onClick={handleConfirmClearAll}
            >
              Confirmar remoção
            </button>
            <button
              className="btn-confirm-cancel"
              onClick={() => setConfirmandoClearAll(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
