import type { Task } from '../../types'
import { Flag, MessageSquare, Pencil, Trash2, Clock, CheckCircle2 } from 'lucide-react'
import { getDueDateInfo, priorityConfig } from '../../lib/taskDisplay'

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  isDone?: boolean
}

export function TaskCard({ task, onClick, onEdit, onDelete, isDone }: TaskCardProps) {
  const priority = priorityConfig[task.priority ?? 'medium']
  const dueInfo = task.dueDate ? getDueDateInfo(task.dueDate) : null

  return (
    <div className="group relative">
      <button
        onClick={() => onClick(task)}
        className={`w-full text-left bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4 pr-16 shadow-sm hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-500 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDone ? 'opacity-70 hover:opacity-100' : ''}`}
      >
        <h4 className={`font-semibold line-clamp-2 leading-snug ${isDone ? 'line-through text-surface-400 dark:text-surface-500' : 'text-surface-800 dark:text-surface-100'}`}>
          {task.title}
        </h4>

        {task.description && (
          <p className={`mt-2 text-sm line-clamp-2 ${isDone ? 'text-surface-400 dark:text-surface-600 line-through opacity-70' : 'text-surface-500 dark:text-surface-400'}`}>
            {task.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-surface-150 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${priority.cardColor} ${priority.cardDarkColor}`}
            >
              <Flag size={10} className={priority.iconColor} />
              <span>{priority.label}</span>
            </div>
            
            {(task.notesCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-surface-450 dark:text-surface-500 font-medium border-l border-surface-200 dark:border-surface-800 pl-2.5">
                <MessageSquare size={13} />
                <span>{task.notesCount}</span>
              </div>
            )}
          </div>

          {isDone ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Completado</span>
            </span>
          ) : dueInfo ? (
            <span className={`flex items-center gap-1.5 text-xs font-bold whitespace-nowrap flex-shrink-0 ${dueInfo.color} ${dueInfo.darkColor}`}>
              {dueInfo.isOverdue ? (
                <span>Vencido</span>
              ) : (
                <>
                  <Clock size={13} />
                  <span>Vence: {dueInfo.label}</span>
                </>
              )}
            </span>
          ) : (
            <span className="text-xs text-surface-400 dark:text-surface-500 font-medium">Sin vencimiento</span>
          )}
        </div>
      </button>

      <div className={`absolute right-2 top-2 flex gap-1 transition-opacity ${onEdit || onDelete ? 'sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 opacity-100' : ''}`}>
        {onEdit && (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onEdit(task)
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800 dark:hover:text-brand-300"
            aria-label="Editar tarea"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onDelete(task)
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            aria-label="Eliminar tarea"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
