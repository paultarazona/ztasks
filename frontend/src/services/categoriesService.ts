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
  userId: string
  color?: string
  parentId?: string | null
  type?: 'folder' | 'list'
}

export interface UpdateCategoryInput {
  id: string
  userId: string
  name?: string
  color?: string | null
  parentId?: string | null
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
  const { userId, ...body } = input
  void userId
  return api<Category>('POST', '/categories', body)
}

export async function updateCategory({ id, userId, ...body }: UpdateCategoryInput): Promise<Category> {
  void userId
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
