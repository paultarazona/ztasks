import { pgTable, serial, text } from 'drizzle-orm/pg-core'

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
})
