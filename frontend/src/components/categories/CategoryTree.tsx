import { useEffect, useState } from 'react'
import { useCategories, useTrashCategories } from '../../hooks/useCategories'
import { usePendingTaskCounts, useTasks } from '../../hooks/useTasks'
import { useAuthStore } from '../../hooks/useAuthStore'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import { CreateTaskDialog } from '../tasks/CreateTaskDialog'
import { TrashDialog } from './TrashDialog'
import { DeleteWarningDialog } from '../warnings/DeleteWarningDialog'
import { CategoryActionsMenu } from './CategoryActionsMenu'
import type { Category } from '../../types'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Folder,
  List,
  Trash2,
} from 'lucide-react'
import { Button } from '../ui/Button'

const EXPANDED_CATEGORIES_STORAGE_KEY = 'taskforge:expanded-categories'

function getExpandedCategoriesStorageKey(userId?: string) {
  return userId
    ? `${EXPANDED_CATEGORIES_STORAGE_KEY}:${userId}`
    : EXPANDED_CATEGORIES_STORAGE_KEY
}

function CategoryNode({
  category,
  children,
  getChildren,
  selectedId,
  onSelect,
  onCreateSub,
  onCreateTask,
  onEdit,
  onDelete,
  pendingTaskCounts,
  expandedCategoryIds,
  onToggleExpanded,
  level = 0,
}: {
  category: Category
  children: Category[]
  getChildren: (parentId: string) => Category[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreateSub: (parentId: string) => void
  onCreateTask: (categoryId: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  pendingTaskCounts: Record<string, number>
  expandedCategoryIds: string[] | null
  onToggleExpanded: (categoryId: string, isExpanded: boolean) => void
  level: number
}) {
  const isFolder = category.type === 'folder'
  const pendingTaskCount = pendingTaskCounts[category.id] ?? 0
  const expanded = expandedCategoryIds
    ? expandedCategoryIds.includes(category.id)
    : isFolder
  const indent = 8 + level * 14
  const connectorLeft = 18 + (level - 1) * 14

  return (
    <div className="relative min-w-0">
      {level > 0 && (
        <>
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-px bg-surface-200 dark:bg-surface-700"
            style={{ left: `${connectorLeft}px` }}
          />
          <span
            aria-hidden="true"
            className="absolute top-[18px] h-px w-3 bg-surface-200 dark:bg-surface-700"
            style={{ left: `${connectorLeft}px` }}
          />
        </>
      )}
      <div
        className={`group grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1 rounded-xl text-sm transition-colors mx-1 sm:mx-2 min-w-0 ${
          selectedId === category.id
            ? 'bg-brand-100 dark:bg-brand-500/20'
            : 'hover:bg-surface-100 dark:hover:bg-surface-800'
        }`}
        style={{ paddingLeft: `${indent}px` }}
      >
        <button
          onClick={() => onToggleExpanded(category.id, expanded)}
          disabled={!isFolder || children.length === 0}
          className={`inline-flex h-8 w-6 items-center justify-center rounded-md hover:bg-surface-200 dark:hover:bg-surface-700 ${
            !isFolder || children.length === 0 ? 'opacity-0 cursor-default' : ''
          }`}
          aria-label={expanded ? 'Contraer' : 'Expandir'}
        >
          {isFolder && children.length > 0 &&
            (expanded ? (
              <ChevronDown size={16} className="text-surface-500" />
            ) : (
              <ChevronRight size={16} className="text-surface-500" />
            ))}
        </button>

        <button
          onClick={() => onSelect(category.id)}
          className="min-w-0 flex w-full items-center gap-2 py-2 rounded-lg text-left"
        >
          {isFolder ? (
            <Folder size={14} className="flex-shrink-0 text-amber-500" />
          ) : (
            <List size={14} className="flex-shrink-0 text-brand-500" />
          )}
          <span
            className={`truncate ${
              selectedId === category.id
                ? 'font-semibold text-brand-800 dark:text-brand-300'
                : 'text-surface-700 dark:text-surface-300 font-medium'
            }`}
          >
            {category.name}
          </span>
          {!isFolder && pendingTaskCount > 0 && (
            <span className="ml-auto rounded-full bg-surface-200 px-1.5 py-0.5 text-[10px] font-bold leading-none text-surface-500 dark:bg-surface-800 dark:text-surface-400">
              {pendingTaskCount}
            </span>
          )}
        </button>

        <div className="pr-1 sm:pr-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <CategoryActionsMenu
            isFolder={isFolder}
            onAdd={() => {
              if (isFolder) {
                onCreateSub(category.id)
              } else {
                onCreateTask(category.id)
              }
            }}
            onEdit={() => onEdit(category.id)}
            onDelete={() => onDelete(category.id)}
          />
        </div>
      </div>
      {expanded && isFolder && children.length > 0 && (
        <div className="mt-0.5 min-w-0">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              children={getChildren(child.id)}
              getChildren={getChildren}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateSub={onCreateSub}
              onCreateTask={onCreateTask}
              onEdit={onEdit}
              onDelete={onDelete}
              pendingTaskCounts={pendingTaskCounts}
              expandedCategoryIds={expandedCategoryIds}
              onToggleExpanded={onToggleExpanded}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CategoryTreeProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function CategoryTree({ selectedId, onSelect }: CategoryTreeProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const {
    data: categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories()
  const { data: deletedCategories } = useTrashCategories()
  const { createTask } = useTasks()
  const { data: pendingTaskCounts } = usePendingTaskCounts()
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[] | null>(() => {
    try {
      const savedIds = window.localStorage.getItem(
        getExpandedCategoriesStorageKey(useAuthStore.getState().user?.id),
      )
      return savedIds ? JSON.parse(savedIds) as string[] : null
    } catch {
      return null
    }
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [subcategoryParentId, setSubcategoryParentId] = useState<string | null>(
    null,
  )
  const [defaultCategoryType, setDefaultCategoryType] = useState<
    'folder' | 'list'
  >('folder')
  const [taskCategoryId, setTaskCategoryId] = useState<string | null>(null)
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null)
  const [categoryToEditId, setCategoryToEditId] = useState<string | null>(null)
  const [trashOpen, setTrashOpen] = useState(false)

  const rootCategories = categories?.filter((c) => !c.parentId) ?? []
  const trashRootCount = (deletedCategories ?? []).filter(
    (category) => category.deletedRootId === category.id || !category.deletedRootId,
  ).length
  const getChildren = (parentId: string) =>
    categories?.filter((c) => c.parentId === parentId) ?? []
  const categoryToDelete = categories?.find((item) => item.id === categoryToDeleteId)

  useEffect(() => {
    if (!expandedCategoryIds) return
    window.localStorage.setItem(
      getExpandedCategoriesStorageKey(userId),
      JSON.stringify(expandedCategoryIds),
    )
  }, [expandedCategoryIds, userId])

  const handleToggleExpanded = (categoryId: string, isExpanded: boolean) => {
    setExpandedCategoryIds((current) => {
      const currentExpandedIds = current ?? (
        categories
          ?.filter((category) => category.type === 'folder')
          .map((category) => category.id) ?? []
      )

      if (isExpanded) {
        return currentExpandedIds.filter((id) => id !== categoryId)
      }

      return [...new Set([...currentExpandedIds, categoryId])]
    })
  }

  const getDescendantIds = (categoryId: string): string[] => {
    const directChildren = getChildren(categoryId)

    return [
      categoryId,
      ...directChildren.flatMap((child) => getDescendantIds(child.id)),
    ]
  }
  const categoryToDeleteIds = categoryToDeleteId ? getDescendantIds(categoryToDeleteId) : []

  const handleCreate = (
    name: string,
    color: string,
    parentId: string | null,
    type: 'folder' | 'list',
  ) => {
    createCategory.mutate(
      { name, color, parentId: parentId, type },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setSubcategoryParentId(null)
        },
      },
    )
  }

  const handleCreateSub = (parentId: string) => {
    setSubcategoryParentId(parentId)
    setDefaultCategoryType('list')
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setCategoryToDeleteId(id)
  }

  const handleEdit = (id: string) => {
    setCategoryToEditId(id)
  }

  const handleRename = (id: string, name: string) => {
    updateCategory.mutate(
      { id, name },
      { onSuccess: () => setCategoryToEditId(null) },
    )
  }

  const handleConfirmDelete = () => {
    if (!categoryToDeleteId) return

    const category = categories?.find((item) => item.id === categoryToDeleteId)
    const ids = getDescendantIds(categoryToDeleteId)
    const deletedAs = category?.type === 'list'
      ? 'list'
      : ids.length > 1
        ? 'tree'
        : 'folder'

    deleteCategory.mutate(
      { ids, rootId: categoryToDeleteId, deletedAs },
      { onSuccess: () => setCategoryToDeleteId(null) },
    )
  }

  const handleOpenRootDialog = (type: 'folder' | 'list' = 'folder') => {
    setSubcategoryParentId(null)
    setDefaultCategoryType(type)
    setDialogOpen(true)
  }

  const handleCreateTask = (categoryId: string) => {
    onSelect(categoryId)
    setTaskCategoryId(categoryId)
  }

  return (
    <div className="flex h-full min-w-0 flex-col py-2">
      <header className="mx-3 mb-3 mt-2 flex items-center justify-between gap-3 border-b border-surface-200/80 px-1 pb-3 dark:border-surface-800/80">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-surface-400 dark:text-surface-500">
          Carpetas y listas
        </h2>
        <Button
          variant="default"
          size="default"
          onClick={() => handleOpenRootDialog('folder')}
          className="h-10 gap-2 rounded-xl px-3 shadow-sm"
          aria-label="Crear carpeta o lista"
          title="Crear carpeta o lista"
        >
          <Plus size={18} strokeWidth={2.6} />
          <span className="text-sm">Crear</span>
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-2 text-sm text-surface-500">Cargando...</div>
        ) : rootCategories.length === 0 ? (
          <div className="px-4 py-4 text-sm text-surface-500">
            <p className="text-center mb-3">No hay carpetas ni listas.</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpenRootDialog('folder')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <Folder size={16} className="text-amber-500" />
                Crear carpeta
              </button>
              <button
                type="button"
                onClick={() => handleOpenRootDialog('list')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <List size={16} className="text-brand-500" />
                Crear lista
              </button>
            </div>
          </div>
        ) : (
          rootCategories.map((cat) => (
            <CategoryNode
              key={cat.id}
              category={cat}
              children={getChildren(cat.id)}
              getChildren={getChildren}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateSub={handleCreateSub}
              onCreateTask={handleCreateTask}
              onEdit={handleEdit}
              onDelete={handleDelete}
              pendingTaskCounts={pendingTaskCounts ?? {}}
              expandedCategoryIds={expandedCategoryIds}
              onToggleExpanded={handleToggleExpanded}
              level={0}
            />
          ))
        )}
      </div>

      <div className="mt-2 px-2 pt-1">
        <button
          type="button"
          onClick={() => setTrashOpen(true)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-500 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          title="Papelera"
        >
          <Trash2 size={14} className="text-surface-400 dark:text-surface-500" />
          <span>Papelera</span>
          {trashRootCount > 0 && (
            <span className="ml-auto rounded-full bg-surface-100 px-1.5 py-0.5 text-[10px] font-semibold text-surface-400 dark:bg-surface-800 dark:text-surface-500">
              {trashRootCount}
            </span>
          )}
        </button>
      </div>

      <CreateCategoryDialog
        parentId={subcategoryParentId}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setSubcategoryParentId(null)
        }}
        onSubmit={handleCreate}
        isSubmitting={createCategory.isPending}
        defaultType={defaultCategoryType}
      />

      {categoryToEditId && (() => {
        const cat = categories?.find((c) => c.id === categoryToEditId)
        return cat ? (
          <CreateCategoryDialog
            editCategory={{ id: cat.id, name: cat.name, type: cat.type }}
            open={!!categoryToEditId}
            onClose={() => setCategoryToEditId(null)}
            onSubmit={() => {}}
            onEditSubmit={handleRename}
            isSubmitting={updateCategory.isPending}
          />
        ) : null
      })()}

      {taskCategoryId && (
        <CreateTaskDialog
          categoryId={taskCategoryId}
          open={!!taskCategoryId}
          onClose={() => setTaskCategoryId(null)}
          onSubmit={(data) => {
            createTask.mutate(
              { ...data, categoryId: taskCategoryId },
              { onSuccess: () => setTaskCategoryId(null) },
            )
          }}
          isSubmitting={createTask.isPending}
        />
      )}

      {categoryToDelete && (
        <DeleteWarningDialog
          open={!!categoryToDelete}
          title="Confirmar eliminación"
          itemName={categoryToDelete.name}
          itemType={categoryToDelete.type}
          affectedCount={categoryToDeleteIds.length}
          isDeleting={deleteCategory.isPending}
          onClose={() => setCategoryToDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <TrashDialog open={trashOpen} onClose={() => setTrashOpen(false)} />
    </div>
  )
}
