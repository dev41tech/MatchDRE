import { useEffect, useReducer, useCallback } from 'react';
import {
  fetchTenants,
  fetchDreGroups,
  fetchMappings,
  bulkUpsert,
  clearCategoryMapping,
  clearAllMappings as clearAllMappingsAPI,
} from '../api/client.js';

// ---------------------------------------------------------------------------
// Estado inicial
// ---------------------------------------------------------------------------
const INITIAL_STATE = {
  tenants:      [],
  tenantId:     null,
  dreGroups:    [],
  categorias:   [],
  selecionadas: new Set(),
  filtroAtivo:  false,
  busca:        '',        // termo de busca livre
  grupoDre:     null,
  loading:      false,
  salvando:     false,
  erro:         null,
  toast:        null,
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
        tenantId:     action.payload,
        categorias:   [],
        selecionadas: new Set(),
        grupoDre:     null,
        dreGroups:    [],
        busca:        '',   // limpa busca ao trocar de tenant
        erro:         null,
      };

    case 'SET_CATEGORIAS':
      return { ...state, categorias: action.payload, loading: false, erro: null };

    case 'SET_DRE_GROUPS':
      return { ...state, dreGroups: action.payload };

    case 'TOGGLE_FILTER':
      return { ...state, filtroAtivo: !state.filtroAtivo };

    case 'SET_BUSCA':
      return { ...state, busca: action.payload };

    case 'TOGGLE_CATEGORY': {
      const next = new Set(state.selecionadas);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, selecionadas: next };
    }

    case 'SELECT_ALL':
      return { ...state, selecionadas: new Set(action.payload) };

    case 'DESELECT_ALL':
      return { ...state, selecionadas: new Set() };

    case 'SET_GRUPO_DRE':
      return { ...state, grupoDre: action.payload };

    case 'AFTER_SAVE':
      return {
        ...state,
        selecionadas: new Set(),
        grupoDre:     null,
        salvando:     false,
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

  // --- Filtro de status ---
  const toggleFilter = useCallback(() => {
    dispatch({ type: 'TOGGLE_FILTER' });
  }, []);

  // --- Busca livre ---
  const setBusca = useCallback((termo) => {
    dispatch({ type: 'SET_BUSCA', payload: termo });
  }, []);

  // --- Seleção de categoria ---
  const toggleCategory = useCallback((chave) => {
    dispatch({ type: 'TOGGLE_CATEGORY', payload: chave });
  }, []);

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

    const payload = {
      grupo_dre: grupoDre,
      categorias: categorias
        .filter(c => selecionadas.has(c.chave_categoria))
        .map(c => ({
          chave_categoria: c.chave_categoria,
          nome_categoria:  c.nome_categoria,
        })),
    };

    try {
      const result = await bulkUpsert(tenantId, payload);

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

  // --- Limpar mapeamento individual ---
  const clearMapping = useCallback(async (chaveCategoria) => {
    const { tenantId } = state;
    if (!tenantId || !chaveCategoria) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await clearCategoryMapping(tenantId, chaveCategoria);

      const categoriasFrescas = await fetchMappings(tenantId);
      dispatch({ type: 'SET_CATEGORIAS', payload: categoriasFrescas });
      dispatch({ type: 'REMOVE_SELECTED_CATEGORY', payload: chaveCategoria });
      dispatch({
        type: 'SET_TOAST',
        payload: { tipo: 'success', mensagem: 'Mapeamento removido com sucesso.' },
      });
    } catch (err) {
      console.error('[useMappings] clearMapping error:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({
        type: 'SET_TOAST',
        payload: { tipo: 'error', mensagem: err.message || 'Erro ao limpar mapeamento.' },
      });
    }
  }, [state]);

  // --- Limpar TODOS os mapeamentos do tenant ---
  const clearAllMappings = useCallback(async () => {
    const { tenantId } = state;
    if (!tenantId) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await clearAllMappingsAPI(tenantId);

      const categoriasFrescas = await fetchMappings(tenantId);
      dispatch({ type: 'SET_CATEGORIAS', payload: categoriasFrescas });
      dispatch({ type: 'DESELECT_ALL' });
      dispatch({
        type: 'SET_TOAST',
        payload: {
          tipo: 'success',
          mensagem: `${result.deleted_count} mapeamento(s) removido(s) com sucesso.`,
        },
      });
    } catch (err) {
      console.error('[useMappings] clearAllMappings error:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({
        type: 'SET_TOAST',
        payload: { tipo: 'error', mensagem: err.message || 'Erro ao limpar mapeamentos.' },
      });
    }
  }, [state]);

  // --- Dismiss toast ---
  const clearToast = useCallback(() => {
    dispatch({ type: 'CLEAR_TOAST' });
  }, []);

  // ---------------------------------------------------------------------------
  // Derivações: filtro de status → busca (aplicados em cascata, localmente)
  // ---------------------------------------------------------------------------

  // 1. Aplica filtro de status
  const filtradas = state.filtroAtivo
    ? state.categorias.filter(c => c.status === 'NAO_MAPEADA')
    : state.categorias;

  // 2. Aplica busca sobre o resultado do filtro de status
  const buscaTrimmed = state.busca.trim().toLowerCase();

  const categoriasVisiveis = buscaTrimmed
    ? filtradas.filter(c =>
        c.codigo_categoria.toLowerCase().includes(buscaTrimmed) ||
        c.nome_categoria.toLowerCase().includes(buscaTrimmed) ||
        (c.grupo_dre_nome?.toLowerCase() ?? '').includes(buscaTrimmed)
      )
    : filtradas;

  // totalAntesBusca: tamanho após filtro de status, antes da busca
  // usado pelo SearchBar para exibir "X de Y"
  const totalAntesBusca = filtradas.length;

  return {
    ...state,
    categoriasVisiveis,
    totalAntesBusca,

    selectTenant,
    toggleFilter,
    setBusca,
    toggleCategory,
    selectAll,
    deselectAll,
    setDreGroup,
    save,
    clearMapping,
    clearAllMappings,
    clearToast,
  };
}
