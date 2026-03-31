/**
 * Testes do hook useMappings.
 * Cobrem: carregamento inicial, seleção de tenant, filtro, habilitação do botão,
 * limpeza pós-save e remoção de mapeamento.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMappings } from '../hooks/useMappings.js';
import * as client from '../api/client.js';

vi.mock('../api/client.js', () => ({
  fetchTenants: vi.fn(),
  fetchDreGroups: vi.fn(),
  fetchMappings: vi.fn(),
  bulkUpsert: vi.fn(),
  clearCategoryMapping: vi.fn(),
}));

const MOCK_TENANTS = ['cliente_a', 'cliente_b'];
const MOCK_GROUPS = [
  { codigo: 'RECEITA_BRUTA', nome: 'RECEITA BRUTA' },
  { codigo: 'OUTRAS_DESPESAS_TOTAIS', nome: 'OUTRAS DESPESAS TOTAIS' },
];
const MOCK_CATEGORIAS = [
  { chave_categoria: '1.01', codigo_categoria: '1.01', nome_categoria: 'Frete', status: 'NAO_MAPEADA', grupo_dre: null, grupo_dre_nome: null, quantidade_uso: 0, ultima_data_uso: null },
  { chave_categoria: '1.02', codigo_categoria: '1.02', nome_categoria: 'Pedágio', status: 'MAPEADA', grupo_dre: 'RECEITA_BRUTA', grupo_dre_nome: 'RECEITA BRUTA', quantidade_uso: 5, ultima_data_uso: '2024-01-01' },
];

beforeEach(() => {
  vi.clearAllMocks();
  client.fetchTenants.mockResolvedValue(MOCK_TENANTS);
  client.fetchDreGroups.mockResolvedValue(MOCK_GROUPS);
  client.fetchMappings.mockResolvedValue(MOCK_CATEGORIAS);
  client.bulkUpsert.mockResolvedValue({
    tenant_id: 'cliente_a',
    grupo_dre: 'RECEITA_BRUTA',
    requested_count: 1,
    processed_count: 1,
    inserted_count: 1,
    updated_count: 0,
  });
  client.clearCategoryMapping.mockResolvedValue({
    tenant_id: 'cliente_a',
    chave_categoria: '1.02',
    cleared: true,
  });
});

describe('carregamento inicial de tenants', () => {
  test('chama fetchTenants ao montar e popula state.tenants', async () => {
    const { result } = renderHook(() => useMappings());

    await waitFor(() => expect(result.current.tenants).toHaveLength(2));
    expect(client.fetchTenants).toHaveBeenCalledTimes(1);
    expect(result.current.tenants).toEqual(MOCK_TENANTS);
  });

  test('loading inicia true e termina false após fetchTenants', async () => {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('seleção de tenant', () => {
  test('selectTenant carrega categorias e dreGroups', async () => {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));

    act(() => { result.current.selectTenant('cliente_a'); });

    await waitFor(() => expect(result.current.categorias).toHaveLength(2));
    expect(client.fetchMappings).toHaveBeenCalledWith('cliente_a');
    expect(client.fetchDreGroups).toHaveBeenCalledWith('cliente_a');
    expect(result.current.dreGroups).toHaveLength(2);
  });

  test('troca de tenant limpa seleção e grupoDre anteriores', async () => {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));

    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));
    act(() => { result.current.toggleCategory('1.01'); });
    act(() => { result.current.setDreGroup('RECEITA_BRUTA'); });

    expect(result.current.selecionadas.size).toBe(1);
    expect(result.current.grupoDre).toBe('RECEITA_BRUTA');

    act(() => { result.current.selectTenant('cliente_b'); });

    expect(result.current.selecionadas.size).toBe(0);
    expect(result.current.grupoDre).toBeNull();
  });
});

describe('filtro local de não mapeadas', () => {
  test('filtroAtivo filtra localmente sem nova requisição à API', async () => {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));
    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));

    const callsBefore = client.fetchMappings.mock.calls.length;

    act(() => { result.current.toggleFilter(); });

    expect(client.fetchMappings.mock.calls.length).toBe(callsBefore);
    expect(result.current.categoriasVisiveis).toHaveLength(1);
    expect(result.current.categoriasVisiveis[0].status).toBe('NAO_MAPEADA');
  });

  test('desativar filtro restaura todas as categorias', async () => {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));
    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));

    act(() => { result.current.toggleFilter(); });
    act(() => { result.current.toggleFilter(); });

    expect(result.current.categoriasVisiveis).toHaveLength(2);
  });
});

describe('habilitação do botão salvar', () => {
  async function setupTenant() {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));
    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));
    return result;
  }

  test('salvar desabilitado quando sem seleção e sem grupo', async () => {
    const result = await setupTenant();
    expect(result.current.selecionadas.size).toBe(0);
    expect(result.current.grupoDre).toBeNull();
  });

  test('salvar desabilitado com seleção mas sem grupo', async () => {
    const result = await setupTenant();
    act(() => { result.current.toggleCategory('1.01'); });
    expect(result.current.selecionadas.size).toBe(1);
    expect(result.current.grupoDre).toBeNull();
  });

  test('salvar habilitado com seleção e grupo', async () => {
    const result = await setupTenant();
    act(() => { result.current.toggleCategory('1.01'); });
    act(() => { result.current.setDreGroup('RECEITA_BRUTA'); });
    expect(result.current.selecionadas.size).toBe(1);
    expect(result.current.grupoDre).toBe('RECEITA_BRUTA');
  });
});

describe('limpeza de seleção após salvar', () => {
  test('após save bem-sucedido: selecionadas e grupoDre são limpos', async () => {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));
    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));

    act(() => { result.current.toggleCategory('1.01'); });
    act(() => { result.current.setDreGroup('RECEITA_BRUTA'); });

    await act(async () => { await result.current.save(); });

    expect(result.current.selecionadas.size).toBe(0);
    expect(result.current.grupoDre).toBeNull();
  });

  test('após save bem-sucedido: toast de sucesso exibido', async () => {
    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));
    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));

    act(() => { result.current.toggleCategory('1.01'); });
    act(() => { result.current.setDreGroup('RECEITA_BRUTA'); });

    await act(async () => { await result.current.save(); });

    expect(result.current.toast).not.toBeNull();
    expect(result.current.toast.tipo).toBe('success');
  });

  test('após save com erro: toast de erro exibido', async () => {
    client.bulkUpsert.mockRejectedValue(new Error('Falha no servidor'));

    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));
    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));

    act(() => { result.current.toggleCategory('1.01'); });
    act(() => { result.current.setDreGroup('RECEITA_BRUTA'); });

    await act(async () => { await result.current.save(); });

    expect(result.current.toast).not.toBeNull();
    expect(result.current.toast.tipo).toBe('error');
  });
});

describe('limpeza de mapeamento', () => {
  test('clearMapping remove o mapeamento e exibe toast de sucesso', async () => {
    const categoriasAtualizadas = [
      MOCK_CATEGORIAS[0],
      { ...MOCK_CATEGORIAS[1], grupo_dre: null, grupo_dre_nome: null, status: 'NAO_MAPEADA' },
    ];

    client.fetchMappings
      .mockResolvedValueOnce(MOCK_CATEGORIAS)
      .mockResolvedValueOnce(categoriasAtualizadas);

    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));

    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));

    act(() => { result.current.toggleCategory('1.02'); });

    await act(async () => { await result.current.clearMapping('1.02'); });

    expect(client.clearCategoryMapping).toHaveBeenCalledWith('cliente_a', '1.02');
    expect(result.current.toast).toEqual({
      tipo: 'success',
      mensagem: 'Mapeamento removido com sucesso.',
    });
    expect(result.current.selecionadas.has('1.02')).toBe(false);
    expect(result.current.categorias[1].status).toBe('NAO_MAPEADA');
  });

  test('clearMapping propaga erro amigável no toast', async () => {
    client.clearCategoryMapping.mockRejectedValue(new Error('Erro ao limpar mapeamento'));

    const { result } = renderHook(() => useMappings());
    await waitFor(() => expect(result.current.tenants).toHaveLength(2));

    act(() => { result.current.selectTenant('cliente_a'); });
    await waitFor(() => expect(result.current.categorias).toHaveLength(2));

    await act(async () => { await result.current.clearMapping('1.02'); });

    expect(result.current.toast).toEqual({
      tipo: 'error',
      mensagem: 'Erro ao limpar mapeamento',
    });
  });
});
