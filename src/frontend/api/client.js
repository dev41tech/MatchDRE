const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
const BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api/v1` : '/api/v1';

async function parseResponseBody(res) {
  const text = await res.text();
  if (!text) return null;

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
  return data.tenants;
}

/** GET /api/v1/tenants/:tenantId/dre-groups */
export async function fetchDreGroups(tenantId) {
  const data = await request(`/tenants/${encodeURIComponent(tenantId)}/dre-groups`);
  return data.groups;
}

/** GET /api/v1/tenants/:tenantId/categories/mappings */
export async function fetchMappings(tenantId) {
  const data = await request(`/tenants/${encodeURIComponent(tenantId)}/categories/mappings`);
  return data.categorias;
}

/** POST /api/v1/tenants/:tenantId/categories/mappings/bulk-upsert */
export async function bulkUpsert(tenantId, payload) {
  return request(
    `/tenants/${encodeURIComponent(tenantId)}/categories/mappings/bulk-upsert`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/** DELETE /api/v1/tenants/:tenantId/categories/:chaveCategoria/mapping */
export async function clearCategoryMapping(tenantId, chaveCategoria) {
  return request(
    `/tenants/${encodeURIComponent(tenantId)}/categories/${encodeURIComponent(chaveCategoria)}/mapping`,
    { method: 'DELETE' }
  );
}

/** DELETE /api/v1/tenants/:tenantId/categories/mappings — remove todos do tenant */
export async function clearAllMappings(tenantId) {
  return request(
    `/tenants/${encodeURIComponent(tenantId)}/categories/mappings`,
    { method: 'DELETE' }
  );
}
