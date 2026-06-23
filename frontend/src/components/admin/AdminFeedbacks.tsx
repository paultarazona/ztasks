import { useState } from 'react'
import { Clock, Trash2, Eye, EyeOff } from 'lucide-react'
import { useAdminFeedbacks, type Feedback } from '../../hooks/useAdminFeedbacks'
import { useRealtimeFeedback } from '../../hooks/useRealtimeFeedback'
import { Button } from '../ui/Button'

export function AdminFeedbacks() {
  const { data: feedbacks, isLoading, markAsRead, deleteFeedback } = useAdminFeedbacks()
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  // Realtime: auto-refresh when new feedback arrives
  useRealtimeFeedback()

  const filteredFeedbacks = feedbacks?.filter((fb) => {
    if (filter === 'unread') return !fb.isRead
    if (filter === 'read') return !!fb.isRead
    return true
  }) ?? []

  const handleMarkAsRead = (fb: Feedback) => {
    markAsRead.mutate({ id: fb.id, read: !fb.isRead })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this feedback?')) {
      deleteFeedback.mutate(id)
      if (selectedFeedback?.id === id) setSelectedFeedback(null)
    }
  }

  const typeLabels: Record<string, string> = {
    feedback: '💬 Feedback',
    suggestion: '💡 Sugerencia',
    bug: '🐛 Bug',
  }

  const typeColors: Record<string, string> = {
    feedback: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    suggestion: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Lista */}
      <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-surface-200 dark:border-surface-800 flex flex-col">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 space-y-3">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Feedbacks</h2>
          <div className="flex gap-1">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'unread' ? 'Sin leer' : 'Leídos'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-sm text-surface-500">Cargando...</p>
          ) : filteredFeedbacks.length === 0 ? (
            <p className="p-4 text-sm text-surface-400">No hay feedbacks</p>
          ) : (
            filteredFeedbacks.map((fb) => (
              <button
                key={fb.id}
                onClick={() => setSelectedFeedback(fb)}
                className={`w-full text-left px-4 py-3 border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors ${
                  selectedFeedback?.id === fb.id ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                } ${!fb.isRead ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColors[fb.type]}`}>
                    {typeLabels[fb.type]}
                  </span>
                  {!fb.isRead && <Clock size={12} className="text-amber-500" />}
                </div>
                <p className="mt-1 text-sm text-surface-700 dark:text-surface-200 line-clamp-2">{fb.message}</p>
                <p className="mt-1 text-xs text-surface-400">
                  {new Date(fb.createdAt).toLocaleString('es-AR')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="hidden sm:flex flex-1 flex-col">
        {selectedFeedback ? (
          <>
            <div className="flex items-center justify-between border-b border-surface-200 p-4 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColors[selectedFeedback.type]}`}>
                  {typeLabels[selectedFeedback.type]}
                </span>
                <span className="text-xs text-surface-400">
                  {new Date(selectedFeedback.createdAt).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(selectedFeedback)}
                >
                  {selectedFeedback.isRead ? <EyeOff size={16} /> : <Eye size={16} />}
                  {selectedFeedback.isRead ? 'Marcar sin leer' : 'Marcar leído'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selectedFeedback.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap">
                {selectedFeedback.message}
              </p>
              {selectedFeedback.isRead && (
                <p className="mt-4 text-xs text-surface-400">
                  Leído
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-surface-400">Seleccioná un feedback para ver el detalle</p>
          </div>
        )}
      </div>
    </div>
  )
}