function toSnake(s: string): string {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function snakeCaseKeys(value: unknown, _parentKey?: string): unknown {
  if (Array.isArray(value)) return value.map((v) => snakeCaseKeys(v))
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => {
        const snakeKey = toSnake(k)
        return [snakeKey, snakeCaseKeys(v, snakeKey)]
      }),
    )
  }
  if (typeof value === 'number' && _parentKey && (_parentKey === 'id' || _parentKey.endsWith('_id'))) {
    return String(value)
  }
  return value
}
