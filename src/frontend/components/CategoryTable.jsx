import React from 'react';

/**
 * Tabela de categorias com suporte a seleção múltipla.
 *
 * Props:
 *   categorias   Categoria[]           - lista de categorias visíveis (já filtradas)
 *   selecionadas Set<string>           - chaves selecionadas
 *   onToggle     (chave) => void       - toggle de uma categoria
 *   onSelectAll  (chaves[]) => void    - selecionar todas visíveis
 *   onDeselectAll () => void           - desmarcar todas
 */
export default function CategoryTable({
  categorias,
  selecionadas,
  onToggle,
  onSelectAll,
  onDeselectAll,
  clearMapping,
}) {
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

  if (categorias.length === 0) {
    return (
      <div className="state-message">
        Nenhuma categoria encontrada para este cliente.
      </div>
    );
  }

  return (
    <div className="category-table-wrapper">
      <table className="category-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input
                type="checkbox"
                checked={todasSelecionadas}
                ref={el => {
                  if (el) el.indeterminate = algumasSelecionadas;
                }}
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
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map(cat => {
            const checked    = selecionadas.has(cat.chave_categoria);
            const rowClass   = cat.status === 'NAO_MAPEADA' ? 'row-nao-mapeada' : 'row-mapeada';

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
                <td>
                  <span className="text-muted">{cat.codigo_categoria}</span>
                </td>
                <td>{cat.nome_categoria}</td>
                <td>{cat.grupo_dre_nome || <span className="text-muted">—</span>}</td>
                <td>
                  {cat.status === 'NAO_MAPEADA' ? (
                    <span className="badge-nao-mapeada">Não mapeada</span>
                  ) : (
                    <span className="badge-mapeada">Mapeada</span>
                  )}
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
                <td>
                  {cat.grupo_dre ? (
                    <button
                      type="button"
                      className="btn-clear-mapping"
                      onClick={() => {
                        const ok = window.confirm(
                          `Deseja remover o grupo DRE da categoria "${cat.nome_categoria}"?`
                        );
                        if (ok) {
                          clearMapping(cat.chave_categoria);
                        }
                      }}
                      title="Limpar mapeamento"
                    >
                      Limpar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-clear-mapping"
                      disabled
                      title="Categoria já está sem grupo DRE"
                    >
                      Limpar
                    </button>
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
