import { useState } from 'react'
import { toCreateTaskInput, useTasks } from '../../hooks/useTasks'
import { CreateTaskDialog } from '../tasks/CreateTaskDialog'
import type { Priority } from '../../types'
import { Pencil, Trash2 } from 'lucide-react'
import { TaskModals } from './TaskModals'
import { useTaskModalState } from '../../hooks/useTaskModalState'
import { getDueDateInfo, priorityConfig, prioritySelectOptions } from '../../lib/taskDisplay'

interface ListViewProps {
  categoryId: string
}

export function ListView({ categoryId }: ListViewProps) {
  const { data: tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(categoryId)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const taskModals = useTaskModalState()

  const filteredTasks = tasks?.filter((task) => {
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false
    return true
  })

  const handleCreateTask = (data: Parameters<typeof toCreateTaskInput>[1]) => {
    createTask.mutate(
      toCreateTaskInput(categoryId, data),
      { onSuccess: () => setCreateDialogOpen(false) }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 border-b border-surface-100 dark:border-surface-800">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
          className="text-xs px-2 py-1.5 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Todas</option>
          {prioritySelectOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="ml-auto px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors"
        >
          Nueva tarea
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTasks?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-surface-400 dark:text-surface-500">
            <p className="text-sm">No hay tareas en esta categoria</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {filteredTasks?.map((task) => {
              const priority = priorityConfig[task.priority]
              const dueInfo = task.dueDate ? getDueDateInfo(task.dueDate) : null
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors hover:bg-surface-50 dark:hover:bg-surface-900"
                >
                  <button
                    type="button"
                    onClick={() => taskModals.openTask(task)}
                    className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{task.title}</h4>
                      {task.description && (
                        <p className="hidden sm:block text-xs text-surface-400 dark:text-surface-500 truncate mt-0.5">{task.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${priority.listColor}`}>
                      {priority.label}
                    </span>
                    {dueInfo && (
                      <span className={`text-[10px] font-medium flex-shrink-0 ${dueInfo.color} ${dueInfo.darkColor}`}>
                        {dueInfo.label}
                      </span>
                    )}
                  </button>
                  <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => taskModals.editTask(task)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800 dark:hover:text-brand-300"
                      aria-label="Editar tarea"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => taskModals.requestDelete(task)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      aria-label="Eliminar tarea"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CreateTaskDialog
        categoryId={categoryId}
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateTask}
        isSubmitting={createTask.isPending}
      />

      <TaskModals
        state={taskModals}
        isUpdating={updateTask.isPending}
        isDeleting={deleteTask.isPending}
        onUpdateTask={(data) => updateTask.mutate(data)}
        onDeleteTask={(task, onSuccess) => deleteTask.mutate(task.id, { onSuccess })}
      />
    </div>
  )
}
