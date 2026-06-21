/**
 * categoriesService — real implementation using apiClient.
 * Slice 4: replaced InsForge stubs with direct apiClient calls.
 *
 * Note: deleteCategory, restoreCategory, and permanentDeleteCategory accept arrays
 * of ids (legacy signature preserved for hook compatibility) and fan out to
 * per-id backend calls.
 */
import { api } from '../lib/apiClient'
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

export async function getCategories(_userId: string): Promise<Category[]> {
  return api<Category[]>('GET', '/categories')
}

export async function getTrashCategories(_userId: string): Promise<Category[]> {
  return api<Category[]>('GET', '/categories?trash=true')
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { user_id, ...body } = input
  void user_id
  return api<Category>('POST', '/categories', body)
}

export async function updateCategory({ id, user_id, ...body }: UpdateCategoryInput): Promise<Category> {
  void user_id
  return api<Category>('PATCH', `/categories/${encodeURIComponent(id)}`, body)
}

export async function deleteCategory({ ids }: DeleteCategoryInput): Promise<void> {
  if (ids.length === 0) return
  await Promise.all(ids.map((id) => api<void>('DELETE', `/categories/${encodeURIComponent(id)}`)))
}

export async function restoreCategory(ids: string[], _userId: string): Promise<void> {
  if (ids.length === 0) return
  await Promise.all(ids.map((id) => api<void>('PATCH', `/categories/${encodeURIComponent(id)}/restore`)))
}

export async function permanentDeleteCategory(ids: string[], _userId: string): Promise<void> {
  if (ids.length === 0) return
  await Promise.all(ids.map((id) => api<void>('DELETE', `/categories/${encodeURIComponent(id)}/permanent`)))
}
