import { Hono } from 'hono'

const NOT_IMPLEMENTED = { error: 'Not implemented', code: 'NOT_IMPLEMENTED' }

export const resetRouter = new Hono()

// Password reset stubs — real implementation is Slice 4
resetRouter.post('/request', (c) => c.json(NOT_IMPLEMENTED, 501))
resetRouter.post('/verify', (c) => c.json(NOT_IMPLEMENTED, 501))
resetRouter.post('/confirm', (c) => c.json(NOT_IMPLEMENTED, 501))
