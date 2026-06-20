/**
 * categoriesService — Slice 1 stub.
 * Forwards to InsForge internally. Slice 4 will replace with real apiClient calls.
 */
import { insforge } from '../lib/insforge'
import type { Category } from '../types'

export interface CreateCategoryInput {
  name: string
  user_id: string
  color?: string
  parent_id?: string | null
  type?: 'folder' | 'list'
}

export interface UpdateCategoryInput {
  id: string
  user_id: string
  name?: string
  color?: string | null
  parent_id?: string | null
}

export interface DeleteCategoryInput {
  ids: string[]
  rootId: string
  userId: string
  deletedAs: 'tree' | 'folder' | 'list'
}

export async function getCategories(userId: string): Promise<Category[]> {
  const { data, error } = await insforge
    .database.from('categories')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data as Category[]
}

export async function getTrashCategories(userId: string): Promise<Category[]> {
  const { data, error } = await insforge
    .database.from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('deleted_at', { ascending: false })

  if (error) throw error
  return (data as Category[]).filter((c) => c.deleted_at)
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { user_id, ...rest } = input
  const { data, error } = await insforge
    .database.from('categories')
    .insert([{ type: 'list', ...rest, user_id }])
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory({ id, user_id, ...input }: UpdateCategoryInput): Promise<Category> {
  const { data, error } = await insforge
    .database.from('categories')
    .update(input)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory({ ids, rootId, userId, deletedAs }: DeleteCategoryInput): Promise<void> {
  if (ids.length === 0) return

  const { error } = await insforge
    .database.from('categories')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_root_id: rootId,
      deleted_as: deletedAs,
    })
    .in('id', ids)
    .eq('user_id', userId)

  if (error) throw error
}

export async function restoreCategory(ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return

  const { error } = await insforge
    .database.from('categories')
    .update({ deleted_at: null, deleted_root_id: null, deleted_as: null })
    .in('id', ids)
    .eq('user_id', userId)

  if (error) throw error
}

export async function permanentDeleteCategory(ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return

  const { error } = await insforge
    .database.from('categories')
    .delete()
    .in('id', ids)
    .eq('user_id', userId)

  if (error) throw error
}
