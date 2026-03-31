import React from 'react';

/**
 * Dropdown de seleção de tenant.
 * Props:
 *   tenants    string[]           - lista de tenant_ids
 *   tenantId   string|null        - valor selecionado
 *   onSelect   (tenantId) => void - callback ao mudar seleção
 *   loading    boolean
 */
export default function TenantSelector({ tenants, tenantId, onSelect, loading }) {
  function handleChange(e) {
    onSelect(e.target.value || null);
  }

  return (
    <div className="tenant-selector">
      <label htmlFor="tenant-select">Cliente:</label>
      <select
        id="tenant-select"
        value={tenantId || ''}
        onChange={handleChange}
        disabled={loading}
        aria-label="Selecionar cliente"
      >
        <option value="">
          {tenants.length === 0 ? 'Nenhum cliente disponível' : '— Selecione um cliente —'}
        </option>
        {tenants.map(t => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
