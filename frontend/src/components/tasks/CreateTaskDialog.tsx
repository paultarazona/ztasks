import { useState } from 'react'
import type { Priority } from '../../types'
import { useTaskStatuses } from '../../hooks/useTaskStatuses'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'

const priorityOptions: Array<{
  value: Priority
  label: string
  className: string
}> = [
  { value: 'low', label: 'Baja', className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300' },
  { value: 'medium', label: 'Media', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300' },
  { value: 'high', label: 'Alta', className: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300' },
  { value: 'urgent', label: 'Urgente', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300' },
]

export interface CreateTaskFormData {
  title: string
  description: string
  priority: Priority
  statusId: string
  dueDate: string | null
}

interface CreateTaskDialogProps {
  categoryId: string
  defaultStatusId?: string
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateTaskFormData) => void
  isSubmitting: boolean
}

export function CreateTaskDialog({
  categoryId,
  defaultStatusId,
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [statusId, setStatusId] = useState('')
  const [dueDate, setDueDate] = useState('')

  const {
    data: statuses,
    isLoading: statusesLoading,
    isError: statusesError,
    seedGlobalStatuses,
  } = useTaskStatuses(categoryId)

  const selectedStatusId = statusId || defaultStatusId || statuses?.[0]?.id || ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedStatusId) return
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      statusId: selectedStatusId,
      dueDate: dueDate || null,
    })
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatusId('')
    setDueDate('')
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatusId('')
    setDueDate('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Nueva tarea">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200"
          >
            Título
          </label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué tenés que hacer?"
            autoFocus
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200"
          >
            Descripción (opcional)
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales..."
            rows={3}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200">
            Prioridad
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {priorityOptions.map((option) => {
              const isSelected = priority === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                    isSelected
                      ? option.className
                      : 'border-surface-200 bg-white text-surface-500 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800'
                  }`}
                  aria-pressed={isSelected}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200"
            >
              Estado
            </label>
            <Select
              id="status"
              value={selectedStatusId}
              onChange={(e) => setStatusId(e.target.value)}
              disabled={statusesLoading || statusesError || (statuses && statuses.length === 0)}
            >
              {statusesLoading ? (
                <option value="">Cargando...</option>
              ) : statusesError ? (
                <option value="">Error al cargar</option>
              ) : statuses && statuses.length > 0 ? (
                statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              ) : (
                <option value="">Creando estados...</option>
              )}
            </Select>
          </div>
          <div>
            <label
              htmlFor="due-date"
              className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200"
            >
              Fecha límite
            </label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {statuses && statuses.length === 0 && !statusesLoading && seedGlobalStatuses.isPending && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Preparando estados...
          </p>
        )}

        <div className="flex gap-3 justify-end border-t border-surface-200 pt-4 dark:border-surface-800">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !selectedStatusId}
          >
            {isSubmitting ? 'Creando...' : 'Crear tarea'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
