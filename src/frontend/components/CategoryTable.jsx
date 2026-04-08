import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// Ícone de lixeira
// ---------------------------------------------------------------------------
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Highlight — envolve as ocorrências do termo em <mark>
// ---------------------------------------------------------------------------
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, termo }) {
  if (!termo || !text) return <>{text}</>;

  const escaped = escapeRegex(termo.trim());
  if (!escaped) return <>{text}</>;

  // split com grupo de captura → partes pares são o texto normal,
  // partes ímpares são as ocorrências que casaram
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <mark key={i} className="search-highlight">{part}</mark>
          : part
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

/**
 * Tabela de categorias com seleção múltipla, confirmação inline de remoção
 * e destaque de termos de busca.
 *
 * Props:
 *   categorias    Categoria[]           — lista já filtrada pelo hook
 *   selecionadas  Set<string>
 *   onToggle      (chave) => void
 *   onSelectAll   (chaves[]) => void
 *   onDeselectAll () => void
 *   clearMapping  (chave) => void
 *   busca         string               — termo de busca para destaque (pode ser '')
 */
export default function CategoryTable({
  categorias,
  selecionadas,
  onToggle,
  onSelectAll,
  onDeselectAll,
  clearMapping,
  busca = '',
}) {
  const [confirmingClear, setConfirmingClear] = useState(null);

  const todasSelecionadas =
    categorias.length > 0 &&
    categorias.every(c => selecionadas.has(c.chave_categoria));

  const algumasSelecionadas =
    !todasSelecionadas &&
    categorias.some(c => selecionadas.has(c.chave_categoria));

  function handleSelectAll(e) {
    if (e.target.checked) {
      onSelectAll(categorias.map(c => c.chave_categoria));
    } else {
      onDeselectAll();
    }
  }

  function handleConfirmClear(chave) {
    setConfirmingClear(null);
    clearMapping(chave);
  }

  // Mensagem de estado vazio — diferencia busca sem resultado de lista vazia
  if (categorias.length === 0) {
    return (
      <div className="state-message">
        {busca.trim()
          ? <>Nenhuma categoria encontrada para <strong>"{busca.trim()}"</strong>.</>
          : 'Nenhuma categoria encontrada para este cliente.'
        }
      </div>
    );
  }

  const termo = busca.trim(); // passado para Highlight

  return (
    <div className="category-table-wrapper">
      <table className="category-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input
                type="checkbox"
                checked={todasSelecionadas}
                ref={el => { if (el) el.indeterminate = algumasSelecionadas; }}
                onChange={handleSelectAll}
                aria-label="Selecionar todas as categorias"
              />
            </th>
            <th>Código</th>
            <th>Nome da Categoria</th>
            <th>Grupo DRE</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Uso (qtd)</th>
            <th>Último uso</th>
            <th style={{ width: 140 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map(cat => {
            const checked      = selecionadas.has(cat.chave_categoria);
            const rowClass     = cat.status === 'NAO_MAPEADA' ? 'row-nao-mapeada' : 'row-mapeada';
            const isConfirming = confirmingClear === cat.chave_categoria;

            return (
              <tr key={cat.chave_categoria} className={rowClass}>
                <td>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(cat.chave_categoria)}
                    aria-label={`Selecionar categoria ${cat.nome_categoria}`}
                  />
                </td>

                {/* Código — com highlight */}
                <td>
                  <code className="code-cell">
                    <Highlight text={cat.codigo_categoria} termo={termo} />
                  </code>
                </td>

                {/* Nome — com highlight */}
                <td>
                  <Highlight text={cat.nome_categoria} termo={termo} />
                </td>

                {/* Grupo DRE — com highlight */}
                <td>
                  {cat.grupo_dre_nome
                    ? (
                      <span className="grupo-dre-nome">
                        <Highlight text={cat.grupo_dre_nome} termo={termo} />
                      </span>
                    )
                    : <span className="text-muted">—</span>
                  }
                </td>

                <td>
                  {cat.status === 'NAO_MAPEADA'
                    ? <span className="badge badge-nao-mapeada">Não mapeada</span>
                    : <span className="badge badge-mapeada">Mapeada</span>
                  }
                </td>

                <td style={{ textAlign: 'right' }}>
                  {cat.quantidade_uso > 0
                    ? cat.quantidade_uso.toLocaleString('pt-BR')
                    : <span className="text-muted">—</span>
                  }
                </td>

                <td>
                  {cat.ultima_data_uso
                    ? new Date(cat.ultima_data_uso).toLocaleDateString('pt-BR')
                    : <span className="text-muted">—</span>
                  }
                </td>

                {/* Ações — confirmação inline, sem popup nativo */}
                <td className="col-actions">
                  {cat.grupo_dre ? (
                    isConfirming ? (
                      <div className="inline-confirm">
                        <span className="inline-confirm-msg">Remover?</span>
                        <button
                          className="btn-inline-yes"
                          onClick={() => handleConfirmClear(cat.chave_categoria)}
                          aria-label={`Confirmar remoção do mapeamento de ${cat.nome_categoria}`}
                        >
                          Sim
                        </button>
                        <button
                          className="btn-inline-cancel"
                          onClick={() => setConfirmingClear(null)}
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-trash"
                        onClick={() => setConfirmingClear(cat.chave_categoria)}
                        title={`Remover mapeamento de "${cat.nome_categoria}"`}
                        aria-label={`Remover mapeamento de ${cat.nome_categoria}`}
                      >
                        <IconTrash />
                        <span>Limpar</span>
                      </button>
                    )
                  ) : (
                    <span className="text-muted" style={{ fontSize: 12 }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="table-footer">
        {selecionadas.size > 0
          ? `${selecionadas.size} categoria(s) selecionada(s) de ${categorias.length} visível(is)`
          : `${categorias.length} categoria(s)`
        }
      </div>
    </div>
  );
}
