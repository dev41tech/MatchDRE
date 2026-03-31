# MatchDRE — Mapeamento de Categorias DRE

App interno multi-tenant para associar categorias financeiras (`bi.d_omie_categoria`) a grupos DRE predefinidos.

---

## Pré-requisitos

- Node.js 20+
- MySQL 8 com banco `bi` acessível
- Tabela `bi.d_omie_categoria` populada

---

## Setup inicial

### 1. Migration do banco

Aplicar no MySQL antes de iniciar o backend:

```sql
-- via mysql CLI:
mysql -u <user> -p <senha> < scripts/migrations/001_create_map_categoria_dre.sql

-- ou colar o conteúdo diretamente no cliente MySQL de preferência
```

### 2. Configurar variáveis de ambiente do backend

```bash
cd src/backend
cp ../../.env.example .env
# editar .env com suas credenciais reais
```

### 3. Instalar dependências

```bash
# Backend
cd src/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Rodar em desenvolvimento

Abra dois terminais:

**Terminal 1 — Backend:**
```bash
cd src/backend
npm run dev
# Servidor rodando em http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd src/frontend
npm run dev
# App disponível em http://localhost:5173
```

O Vite proxeia `/api/*` para `http://localhost:3001` automaticamente.

---

## Rodar em produção

```bash
# Build do frontend
cd src/frontend
npm run build
# dist/ gerado em src/frontend/dist/

# Servir o dist/ estático via nginx, serve, ou diretamente pelo Express:
# No server.js, adicionar: app.use(express.static('../frontend/dist'))

# Backend
cd src/backend
npm start
```

---

## Testes

### Backend

```bash
cd src/backend

# Testes unitários (sem banco):
npm test

# Testes de propriedade (sem banco):
npm run test:properties

# Todos os testes:
npm run test:all
```

### Frontend

```bash
cd src/frontend

# Executar testes (Vitest):
npm test
```

---

## Estrutura do projeto

```
MatchDRE/
├── .env.example                  # Template de variáveis de ambiente
├── README.md
├── scripts/
│   └── migrations/
│       └── 001_create_map_categoria_dre.sql
└── src/
    ├── backend/
    │   ├── package.json
    │   ├── server.js             # Entry point Express
    │   ├── db.js                 # Pool MySQL
    │   ├── constants/dreGroups.js
    │   ├── middleware/validateTenant.js
    │   ├── routes/
    │   │   ├── tenants.js
    │   │   └── mappings.js
    │   ├── services/
    │   │   ├── tenantService.js
    │   │   ├── dreGroupService.js
    │   │   └── mappingService.js
    │   ├── repositories/
    │   │   ├── tenantRepository.js
    │   │   └── mappingRepository.js
    │   └── __tests__/
    │       ├── unit/
    │       └── properties/
    └── frontend/
        ├── package.json
        ├── vite.config.js
        ├── index.html
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── api/client.js
        ├── components/
        │   ├── TenantSelector.jsx
        │   ├── CategoryTable.jsx
        │   ├── ActionBar.jsx
        │   └── Toast.jsx
        ├── hooks/useMappings.js
        └── __tests__/
            └── useMappings.test.js
```

---

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/tenants` | Lista todos os tenants |
| GET | `/api/v1/tenants/:tenantId/dre-groups` | Grupos DRE selecionáveis |
| GET | `/api/v1/tenants/:tenantId/categories/mappings` | Categorias com mapeamento atual |
| POST | `/api/v1/tenants/:tenantId/categories/mappings/bulk-upsert` | Salvar mapeamentos em lote |
| GET | `/health` | Health check |

---

## Pontos de atenção

### Ajuste obrigatório: JOIN com f_movimentacao

Em `src/backend/repositories/mappingRepository.js`, o subquery de enriquecimento assume:
- `bi.f_movimentacao.codigo_categoria`
- `bi.f_movimentacao.data_lancamento`

**Se os nomes de colunas forem diferentes no seu banco, edite o subquery** antes de rodar.
O enriquecimento é opcional e nullable — se o JOIN falhar, o app não quebra, mas retorna erro SQL.
Solução rápida se as colunas não existirem: remover o LEFT JOIN de `f_movimentacao` da query em `getCategories()`.

### Testes de integração (P1, P2, P3, P6, P9)

Os testes de propriedade que verificam comportamento real do banco (idempotência, isolamento multi-tenant, round-trip) requerem um banco de teste isolado e não estão incluídos nos testes automatizados desta entrega de MVP. Para implementá-los, crie um banco `bi_test` e use `jest --testPathPattern=integration`.

### Autenticação

Não implementada intencionalmente (app interno). Adicionar quando necessário.
