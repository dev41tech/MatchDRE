const DEFAULT_ALLOWED_ORIGINS = [
  'https://matchdre.41tech.cloud',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function buildAllowedOrigins(rawOrigins) {
  const values = rawOrigins
    ? rawOrigins.split(',')
    : DEFAULT_ALLOWED_ORIGINS;

  return new Set(
    values
      .map(origin => origin.trim())
      .filter(Boolean)
  );
}

function createCorsMiddleware(rawOrigins = process.env.CORS_ORIGIN) {
  const allowedOrigins = buildAllowedOrigins(rawOrigins);

  return function corsMiddleware(req, res, next) {
    const origin = req.headers.origin;

    if (!origin) {
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      return next();
    }

    if (!allowedOrigins.has(origin)) {
      return res.status(403).json({
        error: {
          code: 'CORS_ORIGIN_NOT_ALLOWED',
          message: 'Origem nao permitida.',
          details: [{ field: 'origin', message: origin }],
        },
      });
    }

    const requestedHeaders = req.headers['access-control-request-headers'];

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      requestedHeaders || 'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  };
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  buildAllowedOrigins,
  createCorsMiddleware,
};
