import React, { useRef } from 'react';

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

/**
 * Barra de busca em tempo real para a tabela de categorias.
 *
 * Props:
 *   value        string            — termo atual
 *   onChange     (termo) => void   — callback ao digitar
 *   resultCount  number            — qtd de categorias visíveis após busca
 *   totalCount   number            — qtd antes da busca (após filtro de status)
 */
export default function SearchBar({ value, onChange, resultCount, totalCount }) {
  const inputRef = useRef(null);

  function handleClear() {
    onChange('');
    inputRef.current?.focus();
  }

  const semResultados = value.trim() !== '' && resultCount === 0;

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-input-icon">
          <IconSearch />
        </span>

        <input
          ref={inputRef}
          type="text"
          className={`search-input${semResultados ? ' search-input-empty' : ''}`}
          placeholder="Buscar por código, nome ou grupo DRE…"
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label="Buscar categorias"
          autoComplete="off"
          spellCheck={false}
        />

        {value && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Limpar busca"
            tabIndex={0}
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Contador — aparece só quando há termo digitado */}
      {value.trim() !== '' && (
        <span className={`search-count${semResultados ? ' search-count-zero' : ''}`}>
          {semResultados
            ? 'Nenhum resultado'
            : `${resultCount} de ${totalCount}`
          }
        </span>
      )}
    </div>
  );
}
