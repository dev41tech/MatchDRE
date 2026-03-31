-- =============================================================================
-- Migration: 001_create_map_categoria_dre
-- Descrição: Cria tabela autoritativa de mapeamento de categorias DRE.
-- Banco:     bi (MySQL 8)
-- Idempotente: usa CREATE TABLE IF NOT EXISTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS bi.map_categoria_dre (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tenant_id        VARCHAR(100)    NOT NULL,
    chave_categoria  VARCHAR(255)    NOT NULL,
    nome_categoria   VARCHAR(500)    NOT NULL,
    grupo_dre        VARCHAR(100)    NOT NULL,
    criado_em        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- Garante unicidade por (tenant, categoria): base do upsert idempotente
    UNIQUE KEY uq_tenant_categoria (tenant_id, chave_categoria),

    INDEX idx_tenant_id (tenant_id),
    INDEX idx_grupo_dre (grupo_dre)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Mapeamento autoritativo de categorias financeiras para grupos DRE por tenant.';

-- =============================================================================
-- Verificações pós-criação (executar manualmente se quiser confirmar):
-- =============================================================================
-- SHOW CREATE TABLE bi.map_categoria_dre;
-- SHOW INDEX FROM bi.map_categoria_dre;
-- DESCRIBE bi.map_categoria_dre;
