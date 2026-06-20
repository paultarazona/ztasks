import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { tasks } from './tasks'

export const taskNotes = pgTable('task_notes', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
