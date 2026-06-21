import { describe, it, expect } from 'vitest'
import { notFound, internalError, badRequest, unauthorized, forbidden, validationError } from './errors'

describe('notFound', () => {
  it('returns error and NOT_FOUND code', () => {
    const result = notFound()
    expect(result).toEqual({ error: 'Not found', code: 'NOT_FOUND' })
  })
})

describe('internalError', () => {
  it('does not include a stack trace in the return value', () => {
    const result = internalError()
    expect('stack' in result).toBe(false)
  })

  it('returns error and INTERNAL_ERROR code', () => {
    const result = internalError()
    expect(result).toEqual({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  })
})

describe('badRequest', () => {
  it('returns BAD_REQUEST code with default message', () => {
    expect(badRequest()).toEqual({ error: 'Bad request', code: 'BAD_REQUEST' })
  })

  it('returns BAD_REQUEST code with custom message', () => {
    expect(badRequest('Missing field')).toEqual({ error: 'Missing field', code: 'BAD_REQUEST' })
  })
})

describe('unauthorized', () => {
  it('returns UNAUTHORIZED code', () => {
    expect(unauthorized()).toEqual({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  })
})

describe('forbidden', () => {
  it('returns FORBIDDEN code', () => {
    expect(forbidden()).toEqual({ error: 'Forbidden', code: 'FORBIDDEN' })
  })
})

describe('validationError', () => {
  it('returns VALIDATION_ERROR code with details', () => {
    const details = { field: 'title', message: 'required' }
    const result = validationError(details)
    expect(result).toEqual({ error: 'Validation error', code: 'VALIDATION_ERROR', details })
  })

  it('returns different details for different inputs', () => {
    const details = [{ field: 'email', message: 'invalid' }]
    const result = validationError(details)
    expect(result.details).toBe(details)
  })
})
