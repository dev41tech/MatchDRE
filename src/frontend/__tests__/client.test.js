import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearCategoryMapping } from '../api/client.js';

describe('client.clearCategoryMapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('envia DELETE para o endpoint esperado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: vi.fn().mockResolvedValue(
        JSON.stringify({ tenant_id: 'cliente_a', chave_categoria: '1.02', cleared: true })
      ),
    });

    const result = await clearCategoryMapping('cliente_a', '1.02');

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/tenants/cliente_a/categories/1.02/mapping', {
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    });
    expect(result.cleared).toBe(true);
  });

  test('não quebra quando a API devolve HTML em erro', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: vi.fn().mockResolvedValue('<!DOCTYPE html><html><body>Not found</body></html>'),
    });

    await expect(clearCategoryMapping('cliente_a', '1.02'))
      .rejects
      .toMatchObject({ message: 'Erro HTTP 404', status: 404, code: 'UNKNOWN_ERROR' });
  });
});
