import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { AppEnv } from '../shared/auth'
import { requireAuth } from '../shared/middleware/requireAuth'
import { db } from '../shared/db'
import { userProfiles } from '../db/schema'

export const userProfilesRouter = new Hono<AppEnv>()

userProfilesRouter.use('*', requireAuth)

// GET /user-profiles/me — returns the authenticated user's profile
userProfilesRouter.get('/me', async (c) => {
  const user = c.get('user')

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))

  // Return empty profile shape if not yet created
  return c.json(profile ?? { userId: user.id, displayName: null, avatarUrl: null })
})

// PATCH /user-profiles/me — update the authenticated user's profile
userProfilesRouter.patch('/me', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ displayName?: string; avatarUrl?: string }>()

  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))

  let result
  if (existing) {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(userProfiles.userId, user.id))
      .returning()
    result = updated
  } else {
    const [inserted] = await db
      .insert(userProfiles)
      .values({ userId: user.id, ...body })
      .returning()
    result = inserted
  }

  return c.json(result)
})
