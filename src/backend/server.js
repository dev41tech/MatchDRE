require('dotenv').config();
const express = require('express');

const tenantsRouter  = require('./routes/tenants');
const mappingsRouter = require('./routes/mappings');
const { createCorsMiddleware } = require('./middleware/cors');

const app  = express();
const PORT = process.env.PORT || 3011;

// --- Middleware global ---
app.use(createCorsMiddleware());
app.use(express.json());

// Log simples de requisições
app.use((req, _res, next) => {
  console.log(`[http] ${req.method} ${req.path}`);
  next();
});

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Rotas da API ---
app.use('/api/v1/tenants', tenantsRouter);
app.use('/api/v1/tenants/:tenantId/categories', mappingsRouter);

// --- Middleware de erro global ---
// Captura qualquer erro não tratado nas rotas.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status  = err.statusCode || 500;
  const code    = err.code       || 'INTERNAL_ERROR';
  const message = err.message    || 'Erro interno no servidor.';
  const details = err.details    || [];

  if (status >= 500) {
    console.error(`[error] ${code}:`, err);
  }

  res.status(status).json({
    error: { code, message, details },
  });
});

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Backend rodando na porta ${PORT}`);
});

module.exports = app; // export para testes
