import React from 'react';
import { useMappings } from './hooks/useMappings.js';
import TenantSelector from './components/TenantSelector.jsx';
import ActionBar      from './components/ActionBar.jsx';
import CategoryTable  from './components/CategoryTable.jsx';
import Toast          from './components/Toast.jsx';

export default function App() {
  const {
    // Estado
    tenants,
    tenantId,
    dreGroups,
    categoriasVisiveis,
    selecionadas,
    filtroAtivo,
    grupoDre,
    loading,
    salvando,
    erro,
    toast,

    // Ações
    selectTenant,
    toggleFilter,
    toggleCategory,
    selectAll,
    deselectAll,
    setDreGroup,
    save,
    clearToast,
    clearMapping,
    
  } = useMappings();

  return (
    <div className="app">
      {/* Cabeçalho */}
      <div className="app-header">
        <h1>Mapeamento de Categorias DRE</h1>
        <p>Associe categorias financeiras aos grupos do DRE por cliente.</p>
      </div>

      {/* Seleção de cliente */}
      <div className="card">
        <TenantSelector
          tenants={tenants}
          tenantId={tenantId}
          onSelect={selectTenant}
          loading={loading}
        />
      </div>

      {/* Conteúdo principal — exibido apenas após seleção de tenant */}
      {tenantId && (
        <>
          <div className="card">
            <ActionBar
              dreGroups={dreGroups}
              grupoDre={grupoDre}
              onSetDreGroup={setDreGroup}
              filtroAtivo={filtroAtivo}
              onToggleFilter={toggleFilter}
              selecionadas={selecionadas}
              salvando={salvando}
              onSave={save}
            />
          </div>

          <div className="card">
            {/* Estado de loading */}
            {loading && (
              <div className="state-message">Carregando categorias…</div>
            )}

            {/* Erro no carregamento */}
            {!loading && erro && (
              <div className="state-message error">{erro}</div>
            )}

            {/* Tabela de categorias */}
            {!loading && !erro && (
              <CategoryTable
                categorias={categoriasVisiveis}
                selecionadas={selecionadas}
                onToggle={toggleCategory}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                clearMapping={clearMapping}
              />
            )}
          </div>
        </>
      )}

      {/* Toast de sucesso/erro */}
      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
