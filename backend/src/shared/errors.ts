export type ErrorResponse = {
  error: string
  code: string
  details?: unknown
}

export function badRequest(msg?: string): ErrorResponse {
  return { error: msg ?? 'Bad request', code: 'BAD_REQUEST' }
}

export function unauthorized(): ErrorResponse {
  return { error: 'Unauthorized', code: 'UNAUTHORIZED' }
}

export function forbidden(): ErrorResponse {
  return { error: 'Forbidden', code: 'FORBIDDEN' }
}

export function notFound(): ErrorResponse {
  return { error: 'Not found', code: 'NOT_FOUND' }
}

export function validationError(details: unknown): ErrorResponse {
  return { error: 'Validation error', code: 'VALIDATION_ERROR', details }
}

export function internalError(): ErrorResponse {
  return { error: 'Internal server error', code: 'INTERNAL_ERROR' }
}
