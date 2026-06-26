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
  deletedAt: timestamp('deleted_at'),
  deletedRootId: integer('deleted_root_id'),
  deletedAs: text('deleted_as').$type<'tree' | 'folder' | 'list'>(),
  deletedOriginalParentId: integer('deleted_original_parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
