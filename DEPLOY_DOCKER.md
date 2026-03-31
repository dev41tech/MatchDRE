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

- Frontend: `80`
- Backend: `3011`

## Observacoes

- O frontend faz proxy de `/api/` para `http://backend:3011`.
- O backend usa as variaveis de ambiente de `src/backend/.env`.
- Se voce quiser trocar o destino da API no frontend, altere `API_UPSTREAM` no `docker-compose.yml`.
