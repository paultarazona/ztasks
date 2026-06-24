import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { Task } from '../../types'
import { toCreateTaskInput, useTasks } from '../../hooks/useTasks'
import { useTaskStatuses } from '../../hooks/useTaskStatuses'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from '../tasks/TaskCard'
import { CreateTaskDialog } from '../tasks/CreateTaskDialog'
import { TaskModals } from '../tasks/TaskModals'
import { useTaskModalState } from '../../hooks/useTaskModalState'

interface KanbanBoardProps {
  categoryId: string
}

export function KanbanBoard({ categoryId }: KanbanBoardProps) {
  const { data: tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask } = useTasks(categoryId)
  const { data: statuses, isLoading: statusesLoading } = useTaskStatuses(categoryId)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>()
  const taskModals = useTaskModalState()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id
    const overId = over.id

    const task = tasks?.find((t) => t.id === taskId)
    if (!task) return

    // overId can be a status (column) ID or a task ID — resolve to a status ID
    const isColumn = statuses?.some((s) => s.id === overId)
    const targetStatusId = isColumn
      ? overId
      : tasks?.find((t) => t.id === overId)?.statusId

    if (targetStatusId != null && task.statusId !== targetStatusId) {
      updateTask.mutate({ id: String(taskId), statusId: String(targetStatusId) })
    }
  }

  const handleCreateTask = (data: Parameters<typeof toCreateTaskInput>[1]) => {
    createTask.mutate(
      toCreateTaskInput(categoryId, data),
      {
        onSuccess: () => setCreateDialogOpen(false),
      }
    )
  }

  if (statusesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  const getTasksByStatus = (statusId: string) =>
    tasks?.filter((t) => t.statusId === statusId) ?? []

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col sm:flex-row gap-3 sm:gap-4 overflow-y-auto sm:overflow-y-hidden overflow-x-hidden p-3 sm:p-6">
          {statuses?.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={getTasksByStatus(status.id)}
              onTaskClick={taskModals.openTask}
              onTaskEdit={taskModals.editTask}
              onTaskDelete={taskModals.requestDelete}
              onCreateTask={() => {
                setDefaultStatusId(status.id)
                setCreateDialogOpen(true)
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 opacity-90">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        categoryId={categoryId}
        defaultStatusId={defaultStatusId}
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
    </>
  )
}
