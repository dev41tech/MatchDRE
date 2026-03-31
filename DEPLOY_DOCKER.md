# Deploy com Docker

## Arquivos

- `docker-compose.yml`
- `src/backend/Dockerfile`
- `src/backend/.dockerignore`
- `src/frontend/Dockerfile`
- `src/frontend/.dockerignore`
- `src/frontend/nginx/default.conf.template`

## Subir na VPS

```bash
docker compose up -d --build
```

## Portas

- Frontend: `85` no host, `80` no container
- Backend: `3011`

## Observacoes

- O frontend faz proxy de `/api/` para `http://backend:3011`.
- O backend usa as variaveis de ambiente de `src/backend/.env`.
- `VITE_API_URL` e lida no build do frontend, nao em runtime no container nginx.
- Se voce quiser chamar a API por dominio externo no browser, ajuste o `build.args.VITE_API_URL` no `docker-compose.yml`.
- Se voce quiser usar somente proxy interno, deixe `VITE_API_URL` vazio e mantenha `API_UPSTREAM`.
