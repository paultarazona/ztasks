import { useState } from 'react'
import type { Task, Priority } from '../../types'
import { useTaskNotes } from '../../hooks/useTaskNotes'
import { prioritySelectOptions } from '../../lib/taskDisplay'

interface TaskDetailModalProps {
  task: Task
  open: boolean
  defaultEditing?: boolean
  onClose: () => void
  onUpdate: (data: { id: string; title?: string; description?: string | null; priority?: Priority; dueDate?: string | null }) => void
  isUpdating: boolean
}

export function TaskDetailModal({ task, open, defaultEditing = false, ...props }: TaskDetailModalProps) {
  if (!open) return null

  return <TaskDetailModalContent key={`${task.id}:${defaultEditing}`} task={task} open={open} defaultEditing={defaultEditing} {...props} />
}

function TaskDetailModalContent({ task, defaultEditing = false, onClose, onUpdate, isUpdating }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing)
  const [wasOpenedEditing] = useState(defaultEditing)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [dueDate, setDueDate] = useState(task.dueDate?.split('T')[0] || '')
  const [newNote, setNewNote] = useState('')

  const { data: notes, createNote, deleteNote } = useTaskNotes(task.id)

  const handleSave = () => {
    onUpdate({
      id: task.id,
      title,
      description: description || null,
      priority,
      dueDate: dueDate || null,
    })
    if (wasOpenedEditing) {
      onClose()
    } else {
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    if (wasOpenedEditing) {
      onClose()
    } else {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setDueDate(task.dueDate?.split('T')[0] || '')
      setIsEditing(false)
    }
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    createNote.mutate(
      { taskId: task.id, content: newNote.trim() },
      { onSuccess: () => setNewNote('') }
    )
  }

  const priorityLabels: Record<Priority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent text-lg font-semibold text-surface-900 dark:text-surface-100 border-b border-surface-300 dark:border-surface-700 focus:outline-none focus:border-brand-500 px-1"
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{task.title}</h3>
          )}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={isUpdating || !title.trim()} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                  Guardar
                </button>
                  <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                  Cancelar
                </button>
              </>
            ) : (
              <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors ml-1" title="Cerrar">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Descripcion</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    {prioritySelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Fecha limite</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Descripcion</h4>
                  <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              <div className="flex gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Prioridad</h4>
                  <span className="text-sm text-surface-700 dark:text-surface-300">{priorityLabels[task.priority]}</span>
                </div>
                {task.dueDate && (
                  <div>
                    <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Fecha limite</h4>
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {new Date(task.dueDate).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-surface-100 dark:border-surface-800 pt-6">
            <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Notas</h4>

            <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Agregar una nota..."
                className="flex-1 px-3 py-2 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newNote.trim() || createNote.isPending}
                className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Agregar
              </button>
            </form>

            <div className="space-y-2">
              {notes?.length === 0 && (
                <p className="text-sm text-surface-400 text-center py-4">
                  Sin notas todavia.
                </p>
              )}
              {notes?.map((note) => (
                <div key={note.id} className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-950 rounded-lg group">
                  <p className="flex-1 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{note.content}</p>
                  <button
                    onClick={() => deleteNote.mutate(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
