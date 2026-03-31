const {
  DEFAULT_ALLOWED_ORIGINS,
  buildAllowedOrigins,
  createCorsMiddleware,
} = require('../../middleware/cors');

function createMockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
  };
}

describe('cors middleware', () => {
  test('usa origens padrao quando CORS_ORIGIN nao e informado', () => {
    const allowedOrigins = buildAllowedOrigins();

    expect(allowedOrigins).toEqual(new Set(DEFAULT_ALLOWED_ORIGINS));
  });

  test('autoriza o dominio do frontend e responde preflight', () => {
    const middleware = createCorsMiddleware();
    const req = {
      method: 'OPTIONS',
      headers: {
        origin: 'https://matchdre.41tech.cloud',
        'access-control-request-headers': 'content-type',
      },
    };
    const res = createMockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://matchdre.41tech.cloud');
    expect(next).not.toHaveBeenCalled();
  });

  test('bloqueia origem nao permitida com 403', () => {
    const middleware = createCorsMiddleware();
    const req = {
      method: 'GET',
      headers: {
        origin: 'https://evil.example.com',
      },
    };
    const res = createMockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('CORS_ORIGIN_NOT_ALLOWED');
    expect(next).not.toHaveBeenCalled();
  });
});
