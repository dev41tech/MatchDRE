const BASE_URL = '/api/v1';

/**
 * Helper interno: faz fetch e lança erro se resposta não for 2xx.
 * Extrai { error.message } da resposta JSON quando disponível.
 */
async function parseResponseBody(res) {
  const text = await res.text();

  if (!text) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return JSON.parse(text);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await parseResponseBody(res);

  if (!res.ok) {
    const message = data?.error?.message || `Erro HTTP ${res.status}`;
    const code    = data?.error?.code    || 'UNKNOWN_ERROR';
    const err     = new Error(message);
    err.code      = code;
    err.status    = res.status;
    err.details   = data?.error?.details || [];
    throw err;
  }

  return data;
}

/** GET /api/v1/tenants */
export async function fetchTenants() {
  const data = await request('/tenants');
  return data.tenants; // string[]
}

/** GET /api/v1/tenants/:tenantId/dre-groups */
export async function fetchDreGroups(tenantId) {
  const data = await request(`/tenants/${encodeURIComponent(tenantId)}/dre-groups`);
  return data.groups; // [{ codigo, nome }]
}

/** GET /api/v1/tenants/:tenantId/categories/mappings */
export async function fetchMappings(tenantId) {
  const data = await request(`/tenants/${encodeURIComponent(tenantId)}/categories/mappings`);
  return data.categorias; // Categoria[]
}

/**
 * POST /api/v1/tenants/:tenantId/categories/mappings/bulk-upsert
 * @param {string} tenantId
 * @param {{ grupo_dre: string, categorias: Array<{chave_categoria, nome_categoria}> }} payload
 */
export async function bulkUpsert(tenantId, payload) {
  return request(
    `/tenants/${encodeURIComponent(tenantId)}/categories/mappings/bulk-upsert`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function clearCategoryMapping(tenantId, chaveCategoria) {
  return request(
    `/tenants/${encodeURIComponent(tenantId)}/categories/${encodeURIComponent(chaveCategoria)}/mapping`,
    {
      method: 'DELETE',
    }
  );
}
