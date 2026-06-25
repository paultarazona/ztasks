import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { AppEnv } from '../shared/auth'
import { requireAuth } from '../shared/middleware/require-auth'
import { getDb } from '../shared/db'
import { userProfiles } from '../db/schema'
import { validationError } from '../shared/errors'

export const avatarRouter = new Hono<AppEnv>()

// POST /auth/avatar — upload avatar; stores as data URL in user_profiles
avatarRouter.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || typeof file === 'string') {
    return c.json(validationError({ file: 'required' }), 422)
  }

  const buffer = await (file as File).arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const dataUrl = `data:${(file as File).type};base64,${base64}`

  const db = getDb()
  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))

  if (existing) {
    await db
      .update(userProfiles)
      .set({ avatarUrl: dataUrl, updatedAt: new Date() })
      .where(eq(userProfiles.userId, user.id))
  } else {
    await db
      .insert(userProfiles)
      .values({ userId: user.id, avatarUrl: dataUrl })
  }

  return c.json({ url: dataUrl })
})
