export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} was not found.` } });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = Number(err.status || 500);
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  if (status >= 500) console.error('[api-error]', req.method, req.path, err.message);
  res.status(status).json({
    error: {
      code,
      message: status >= 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred.'
        : err.message || 'Request failed.'
    }
  });
}
