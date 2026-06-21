import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})
