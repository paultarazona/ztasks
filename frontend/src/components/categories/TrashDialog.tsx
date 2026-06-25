import { useState } from 'react'
import { Folder, List, RotateCcw, Trash2, X } from 'lucide-react'
import { useTrashCategories } from '../../hooks/useCategories'
import type { Category } from '../../types'
import { Button } from '../ui/Button'
import { WarningDialog } from '../warnings/WarningDialog'

interface TrashDialogProps {
  open: boolean
  onClose: () => void
}

const deletedAsLabel: Record<NonNullable<Category['deletedAs']>, string> = {
  tree: 'Árbol completo',
  folder: 'Carpeta',
  list: 'Lista',
}

function formatDeletedAt(value: string | null) {
  if (!value) return 'Sin fecha'

  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TrashDialog({ open, onClose }: TrashDialogProps) {
  const { data: deletedCategories, isLoading, restoreCategory, permanentDelete } = useTrashCategories()
  const deleted = deletedCategories ?? []
  const roots = deleted.filter(
    (category) => category.deletedRootId === category.id || !category.deletedRootId,
  )
  const [itemToDelete, setItemToDelete] = useState<{ ids: string[]; name: string } | null>(null)
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false)

  if (!open) return null

  const getTrashGroupIds = (root: Category) => {
    const rootId = root.deletedRootId ?? root.id
    return deleted
      .filter((category) => category.deletedRootId === rootId || category.id === root.id)
      .map((category) => category.id)
  }

  const handleDeleteItem = () => {
    if (!itemToDelete) return
    permanentDelete.mutate(itemToDelete.ids, {
      onSuccess: () => setItemToDelete(null),
    })
  }

  const handleEmptyTrash = () => {
    const allIds = roots.flatMap((root) => getTrashGroupIds(root))
    permanentDelete.mutate(allIds, {
      onSuccess: () => setEmptyTrashOpen(false),
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <section className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-900">
          <header className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-300">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-950 dark:text-surface-50">
                  Papelera
                </h3>
                <p className="text-sm text-surface-500">
                  Elementos eliminados por árbol, carpeta o lista.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {roots.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmptyTrashOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Vaciar papelera
                </Button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:hover:bg-surface-800 dark:hover:text-white"
                aria-label="Cerrar papelera"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <p className="py-10 text-center text-sm text-surface-500">Cargando papelera...</p>
            ) : roots.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-surface-200 p-8 text-center dark:border-surface-700">
                <Trash2 size={34} className="mx-auto mb-3 text-surface-300" />
                <p className="font-semibold text-surface-700 dark:text-surface-200">
                  La papelera está vacía
                </p>
                <p className="mt-1 text-sm text-surface-500">
                  Cuando elimines carpetas o listas, van a aparecer acá.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {roots.map((root) => {
                  const ids = getTrashGroupIds(root)
                  const isList = root.type === 'list'
                  const deletedAs = root.deletedAs ?? root.type

                  return (
                    <article
                      key={root.id}
                      className="rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-950"
                    >
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-surface-500 dark:bg-surface-900">
                          {isList ? (
                            <List size={18} className="text-brand-500" />
                          ) : (
                            <Folder size={18} className="text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-surface-900 dark:text-surface-100">
                            {root.name}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-surface-500">
                            <span className="rounded-full bg-surface-200 px-2 py-0.5 font-medium dark:bg-surface-800">
                              {deletedAsLabel[deletedAs]}
                            </span>
                            <span>{ids.length} elemento{ids.length !== 1 ? 's' : ''}</span>
                            <span>{formatDeletedAt(root.deletedAt)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => restoreCategory.mutate(ids)}
                            disabled={restoreCategory.isPending}
                            className="gap-2"
                          >
                            <RotateCcw size={15} />
                            Restaurar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemToDelete({ ids, name: root.name })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </main>
        </section>
      </div>

      {itemToDelete && (
        <WarningDialog
          open={!!itemToDelete}
          title="Eliminar permanentemente"
          heading="¿Eliminar este elemento?"
          message={`"${itemToDelete.name}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          isPending={permanentDelete.isPending}
          confirmVariant="destructive"
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDeleteItem}
        />
      )}

      <WarningDialog
        open={emptyTrashOpen}
        title="Vaciar papelera"
        heading="¿Vaciar toda la papelera?"
        message={`Se eliminarán ${roots.length} elemento${roots.length !== 1 ? 's' : ''} permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Vaciar papelera"
        isPending={permanentDelete.isPending}
        confirmVariant="destructive"
        onClose={() => setEmptyTrashOpen(false)}
        onConfirm={handleEmptyTrash}
      />
    </>
  )
}
