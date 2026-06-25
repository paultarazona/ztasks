import type { Priority } from '../types'

export const priorityConfig: Record<
  Priority,
  {
    label: string
    listColor: string
    cardColor: string
    cardDarkColor: string
    iconColor: string
  }
> = {
  low: {
    label: 'Baja',
    listColor: 'bg-slate-100 text-slate-600',
    cardColor: 'bg-green-100 text-green-800',
    cardDarkColor: 'dark:bg-green-900/40 dark:text-green-300',
    iconColor: 'text-green-500',
  },
  medium: {
    label: 'Media',
    listColor: 'bg-amber-100 text-amber-700',
    cardColor: 'bg-yellow-100 text-yellow-800',
    cardDarkColor: 'dark:bg-yellow-900/40 dark:text-yellow-300',
    iconColor: 'text-yellow-500',
  },
  high: {
    label: 'Alta',
    listColor: 'bg-orange-100 text-orange-700',
    cardColor: 'bg-orange-100 text-orange-800',
    cardDarkColor: 'dark:bg-orange-900/40 dark:text-orange-300',
    iconColor: 'text-orange-500',
  },
  urgent: {
    label: 'Urgente',
    listColor: 'bg-red-100 text-red-700',
    cardColor: 'bg-red-100 text-red-800',
    cardDarkColor: 'dark:bg-red-900/40 dark:text-red-300',
    iconColor: 'text-red-500',
  },
}

export const prioritySelectOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const satisfies Array<{ value: Priority; label: string }>

export function getDueDateInfo(dueDate: string): { label: string; color: string; darkColor: string; isOverdue: boolean } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  // Format date to a friendly label like "24 May"
  const day = due.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthLabel = months[due.getMonth()]
  const staticLabel = `${day} ${monthLabel}`

  if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600', darkColor: 'dark:text-red-400', isOverdue: true }
  if (diffDays === 0) return { label: 'Today', color: 'text-red-600', darkColor: 'dark:text-red-400', isOverdue: true }
  if (diffDays === 1) return { label: 'Tomorrow', color: 'text-orange-600', darkColor: 'dark:text-orange-400', isOverdue: false }
  if (diffDays <= 3) return { label: staticLabel, color: 'text-amber-600', darkColor: 'dark:text-amber-400', isOverdue: false }
  if (diffDays <= 7) return { label: staticLabel, color: 'text-blue-600', darkColor: 'dark:text-blue-400', isOverdue: false }
  return { label: staticLabel, color: 'text-surface-500', darkColor: 'dark:text-surface-400', isOverdue: false }
}
