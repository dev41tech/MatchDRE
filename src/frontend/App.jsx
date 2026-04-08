import React from 'react';
import { useMappings } from './hooks/useMappings.js';
import TenantSelector from './components/TenantSelector.jsx';
import ActionBar      from './components/ActionBar.jsx';
import SearchBar      from './components/SearchBar.jsx';
import CategoryTable  from './components/CategoryTable.jsx';
import Toast          from './components/Toast.jsx';

export default function App() {
  const {
    tenants,
    tenantId,
    dreGroups,
    categoriasVisiveis,
    categorias,
    totalAntesBusca,
    selecionadas,
    filtroAtivo,
    busca,
    grupoDre,
    loading,
    salvando,
    erro,
    toast,

    selectTenant,
    toggleFilter,
    setBusca,
    toggleCategory,
    selectAll,
    deselectAll,
    setDreGroup,
    save,
    clearToast,
    clearMapping,
    clearAllMappings,
  } = useMappings();

  const temMapeamentos = categorias.some(c => c.status === 'MAPEADA');

  return (
    <div className="app">
      {/* Cabeçalho */}
      <header className="app-header">
        <div className="app-header-content">
          <div>
            <h1>Mapeamento DRE</h1>
            <p>Associe categorias financeiras aos grupos do Demonstrativo de Resultado por cliente.</p>
          </div>
        </div>
      </header>

      {/* Seleção de cliente */}
      <div className="card">
        <TenantSelector
          tenants={tenants}
          tenantId={tenantId}
          onSelect={selectTenant}
          loading={loading && !tenantId}
        />
      </div>

      {tenantId && (
        <>
          {/* ActionBar sticky */}
          <div className="action-bar-sticky">
            <ActionBar
              dreGroups={dreGroups}
              grupoDre={grupoDre}
              onSetDreGroup={setDreGroup}
              filtroAtivo={filtroAtivo}
              onToggleFilter={toggleFilter}
              selecionadas={selecionadas}
              salvando={salvando}
              onSave={save}
              onClearAll={clearAllMappings}
              temMapeamentos={temMapeamentos}
            />
          </div>

          {/* Card da tabela */}
          <div className="card">
            {loading && (
              <div className="state-loading">
                <div className="loading-spinner" />
                <span>Carregando categorias…</span>
              </div>
            )}

            {!loading && erro && (
              <div className="state-message error">
                <strong>Erro ao carregar:</strong> {erro}
              </div>
            )}

            {!loading && !erro && (
              <>
                {/* Toolbar da tabela: barra de busca */}
                <div className="table-toolbar">
                  <SearchBar
                    value={busca}
                    onChange={setBusca}
                    resultCount={categoriasVisiveis.length}
                    totalCount={totalAntesBusca}
                  />
                </div>

                <CategoryTable
                  categorias={categoriasVisiveis}
                  selecionadas={selecionadas}
                  onToggle={toggleCategory}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  clearMapping={clearMapping}
                  busca={busca}
                />
              </>
            )}
          </div>
        </>
      )}

      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
