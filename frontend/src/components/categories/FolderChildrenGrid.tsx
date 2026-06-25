import { useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import { Folder, List, ChevronRight } from 'lucide-react'

interface FolderChildrenGridProps {
  categoryId: string
}

export function FolderChildrenGrid({ categoryId }: FolderChildrenGridProps) {
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const children = categories?.filter((c) => c.parentId === categoryId) ?? []

  return (
    <div className="p-4 sm:p-6">
      {children.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-surface-400">
          <div className="text-center p-6 sm:p-8 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl">
            <Folder size={40} className="mx-auto text-surface-300 dark:text-surface-600" />
            <p className="mt-4 text-base sm:text-lg font-medium text-surface-600 dark:text-surface-400">
              Carpeta vacía
            </p>
            <p className="text-xs sm:text-sm text-surface-500 mt-1">
              Tocá el menú ⋮ en la carpeta para crear subcarpetas o listas.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {children.map((child) => {
            const isFolder = child.type === 'folder'
            const childCount = isFolder
              ? categories?.filter((c) => c.parentId === child.id).length ?? 0
              : 0

            return (
              <button
                key={child.id}
                onClick={() => navigate(`/dashboard/category/${child.id}`)}
                className="group flex items-start gap-4 p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                  {isFolder ? (
                    <Folder size={20} className="text-amber-500" />
                  ) : (
                    <List size={20} className="text-brand-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {child.name}
                  </h3>
                  <p className="text-xs text-surface-400 mt-1">
                    {isFolder
                      ? `${childCount} subcarpeta${childCount !== 1 ? 's' : ''}`
                      : 'Lista de tareas'}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-surface-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-2"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
