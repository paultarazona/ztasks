export interface Category {
  id: string
  userId: string
  name: string
  color: string | null
  parentId: string | null
  type: 'folder' | 'list'
  deletedAt: string | null
  deletedRootId: string | null
  deletedAs: 'tree' | 'folder' | 'list' | null
  deletedOriginalParentId: string | null
  createdAt: string
}

export interface TaskStatus {
  id: string
  userId: string
  categoryId: string | null
  name: string
  position: number
  color: string
  createdAt: string
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  userId: string
  categoryId: string
  statusId: string
  title: string
  description: string | null
  priority: Priority
  dueDate: string | null
  notesCount?: number
  createdAt: string
  updatedAt: string
}

export interface TaskNote {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
}

export type CategoryTree = Category & {
  children: CategoryTree[]
}
