import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { categories } from './categories'
import { taskStatuses } from './task-statuses'

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  title: text('title').notNull(),
  description: text('description'),
  statusId: integer('status_id').references(() => taskStatuses.id),
  position: integer('position'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
