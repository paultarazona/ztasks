import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  parentId: integer('parent_id'),
  name: text('name').notNull(),
  color: text('color'),
  type: text('type').$type<'folder' | 'list'>().default('list').notNull(),
  position: integer('position'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
