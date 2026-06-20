import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core'

export const taskStatuses = pgTable('task_statuses', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id'),
  name: text('name').notNull(),
  color: text('color'),
  position: integer('position'),
  isGlobal: boolean('is_global').default(false),
})
