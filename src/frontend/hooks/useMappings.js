import { useEffect, useReducer, useCallback } from 'react';
import {
  fetchTenants,
  fetchDreGroups,
  fetchMappings,
  bulkUpsert,
  clearCategoryMapping,
} from '../api/client.js';

// ---------------------------------------------------------------------------
// Estado inicial
// ---------------------------------------------------------------------------
const INITIAL_STATE = {
  tenants:     [],        // string[] — lista de tenant_ids disponíveis
  tenantId:    null,      // tenant selecionado atualmente
  dreGroups:   [],        // [{ codigo, nome }] grupos selecionáveis
  categorias:  [],        // Categoria[] carregadas da API (lista completa)
  selecionadas: new Set(), // Set<chave_categoria>
  filtroAtivo: false,     // "somente não mapeadas"
  grupoDre:    null,      // código do grupo DRE escolhido
  loading:     false,
  salvando:    false,
  erro:        null,
  toast:       null,      // { tipo: 'success'|'error', mensagem: string }
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function reducer(state, action) {
  switch (action.type) {

    case 'SET_TENANTS':
      return { ...state, tenants: action.payload, loading: false, erro: null };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_SALVANDO':
      return { ...state, salvando: action.payload };

    case 'SET_ERRO':
      return { ...state, erro: action.payload, loading: false, salvando: false };

    case 'SELECT_TENANT':
      return {
        ...state,
        tenantId: action.payload,
        categorias: [],
        selecionadas: new Set(),
        grupoDre: null,
        dreGroups: [],
        erro: null,
      };

    case 'SET_CATEGORIAS':
      return { ...state, categorias: action.payload, loading: false, erro: null };

    case 'SET_DRE_GROUPS':
      return { ...state, dreGroups: action.payload };

    case 'TOGGLE_FILTER':
      return { ...state, filtroAtivo: !state.filtroAtivo };

    case 'TOGGLE_CATEGORY': {
      const next = new Set(state.selecionadas);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, selecionadas: next };
    }

    case 'SELECT_ALL': {
      const visiveis = action.payload; // chave_categoria[] das linhas visíveis
      return { ...state, selecionadas: new Set(visiveis) };
    }

    case 'DESELECT_ALL':
      return { ...state, selecionadas: new Set() };

    case 'SET_GRUPO_DRE':
      return { ...state, grupoDre: action.payload };

    case 'AFTER_SAVE':
      return {
        ...state,
        selecionadas: new Set(),
        grupoDre: null,
        salvando: false,
      };

    case 'REMOVE_SELECTED_CATEGORY': {
      const next = new Set(state.selecionadas);
      next.delete(action.payload);
      return { ...state, selecionadas: next };
    }

    case 'SET_TOAST':
      return { ...state, toast: action.payload };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useMappings() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // --- Carregamento inicial de tenants ---
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    fetchTenants()
      .then(tenants => dispatch({ type: 'SET_TENANTS', payload: tenants }))
      .catch(err => {
        console.error('[useMappings] fetchTenants error:', err);
        dispatch({ type: 'SET_ERRO', payload: err.message });
      });
  }, []);

  // --- Seleção de tenant ---
  const selectTenant = useCallback((tenantId) => {
    dispatch({ type: 'SELECT_TENANT', payload: tenantId });
    if (!tenantId) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    // Busca categorias e grupos DRE em paralelo
    Promise.all([
      fetchMappings(tenantId),
      fetchDreGroups(tenantId),
    ])
      .then(([categorias, dreGroups]) => {
        dispatch({ type: 'SET_CATEGORIAS', payload: categorias });
        dispatch({ type: 'SET_DRE_GROUPS', payload: dreGroups });
      })
      .catch(err => {
        console.error('[useMappings] selectTenant error:', err);
        dispatch({ type: 'SET_ERRO', payload: err.message });
      });
  }, []);

  // --- Filtro local ---
  const toggleFilter = useCallback(() => {
    dispatch({ type: 'TOGGLE_FILTER' });
  }, []);

  // --- Seleção de categoria ---
  const toggleCategory = useCallback((chave) => {
    dispatch({ type: 'TOGGLE_CATEGORY', payload: chave });
  }, []);

  // --- Selecionar todas as visíveis ---
  const selectAll = useCallback((chavesVisiveis) => {
    dispatch({ type: 'SELECT_ALL', payload: chavesVisiveis });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL' });
  }, []);

  // --- Grupo DRE ---
  const setDreGroup = useCallback((codigo) => {
    dispatch({ type: 'SET_GRUPO_DRE', payload: codigo });
  }, []);

  // --- Salvar ---
  const save = useCallback(async () => {
    const { tenantId, grupoDre, selecionadas, categorias } = state;
    if (!tenantId || !grupoDre || selecionadas.size === 0) return;

    dispatch({ type: 'SET_SALVANDO', payload: true });

    // Monta payload com chave + nome das categorias selecionadas
    const payload = {
      grupo_dre: grupoDre,
      categorias: categorias
        .filter(c => selecionadas.has(c.chave_categoria))
        .map(c => ({
          chave_categoria: c.chave_categoria,
          nome_categoria: c.nome_categoria,
        })),
    };

    try {
      const result = await bulkUpsert(tenantId, payload);

      // Recarrega a listagem após sucesso
      const categoriasFrescas = await fetchMappings(tenantId);
      dispatch({ type: 'SET_CATEGORIAS', payload: categoriasFrescas });
      dispatch({ type: 'AFTER_SAVE' });

      const msg = `Salvo! ${result.inserted_count} inserido(s), ${result.updated_count} atualizado(s).`;
      dispatch({ type: 'SET_TOAST', payload: { tipo: 'success', mensagem: msg } });
    } catch (err) {
      console.error('[useMappings] save error:', err);
      dispatch({ type: 'SET_SALVANDO', payload: false });
      dispatch({
        type: 'SET_TOAST',
        payload: { tipo: 'error', mensagem: err.message || 'Erro ao salvar mapeamentos.' },
      });
    }
  }, [state]);

  const clearMapping = useCallback(async (chaveCategoria) => {
    const { tenantId, selecionadas } = state;
    if (!tenantId || !chaveCategoria) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await clearCategoryMapping(tenantId, chaveCategoria);

      const categoriasFrescas = await fetchMappings(tenantId);
      dispatch({ type: 'SET_CATEGORIAS', payload: categoriasFrescas });

      dispatch({
        type: 'SET_TOAST',
        payload: { tipo: 'success', mensagem: 'Mapeamento removido com sucesso.' },
      });

      dispatch({ type: 'REMOVE_SELECTED_CATEGORY', payload: chaveCategoria });
    } catch (err) {
      console.error('[useMappings clearMapping error:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({
        type: 'SET_TOAST',
        payload: { tipo: 'error', mensagem: err.message || 'Erro ao limpar mapeamento.'},
      });
    }
  }, [state]);

  // --- Dismiss toast ---
  const clearToast = useCallback(() => {
    dispatch({ type: 'CLEAR_TOAST' });
  }, []);

  // --- Categorias visíveis (com filtro aplicado localmente) ---
  const categoriasVisiveis = state.filtroAtivo
    ? state.categorias.filter(c => c.status === 'NAO_MAPEADA')
    : state.categorias;

  return {
    // Estado
    ...state,
    categoriasVisiveis,

    // Ações
    selectTenant,
    toggleFilter,
    toggleCategory,
    selectAll,
    deselectAll,
    setDreGroup,
    save,
    clearMapping,
    clearToast,
  };
}
