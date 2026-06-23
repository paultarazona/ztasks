import { CheckCircle, Clock } from 'lucide-react'
import { useAdminFeedbacks, useAdminStats } from '../../hooks/useAdminFeedbacks'
import { useRealtimeFeedback } from '../../hooks/useRealtimeFeedback'
import { NavLink } from 'react-router-dom'

export function AdminOverview() {
  const { data: stats } = useAdminStats()
  const { data: feedbacks } = useAdminFeedbacks()
  const recentFeedbacks = feedbacks?.slice(0, 5) ?? []

  // Realtime: invalidate queries when feedback changes
  useRealtimeFeedback()

  const byType = stats?.byType ?? {}
  const typeColors: Record<string, string> = {
    feedback: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    suggestion: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-xs text-surface-400">Conectado en tiempo real</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Overview</h1>
        <p className="text-sm text-surface-500 mt-1">Métricas y actividad del sistema</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Feedbacks"
          value={stats?.totalFeedbacks ?? 0}
          icon="💬"
          bg="bg-brand-100 dark:bg-brand-900/30"
          textColor="text-brand-500"
        />
        <StatCard
          label="Total Usuarios"
          value={stats?.totalUsers ?? 0}
          icon="👥"
          bg="bg-amber-100 dark:bg-amber-900/30"
          textColor="text-amber-500"
        />
        <StatCard
          label="Sin leer"
          value={stats?.unreads ?? 0}
          icon="👁️"
          bg="bg-red-100 dark:bg-red-900/30"
          textColor="text-red-500"
        />
        <StatCard
          label="Leídos"
          value={(stats?.totalFeedbacks ?? 0) - (stats?.unreads ?? 0)}
          icon="✅"
          bg="bg-green-100 dark:bg-green-900/30"
          textColor="text-green-500"
        />
      </div>

      {/* Feedbacks por tipo */}
      <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3">Por tipo</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, count]) => (
            <span
              key={type}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium capitalize ${typeColors[type] ?? 'bg-surface-100 text-surface-600'}`}
            >
              {type === 'bug' ? '🐛' : type === 'suggestion' ? '💡' : '💬'} {type}: {count as number}
            </span>
          ))}
          {Object.keys(byType).length === 0 && (
            <p className="text-sm text-surface-400">Sin feedbacks aún</p>
          )}
        </div>
      </div>

      {/* Últimos feedbacks */}
      <div className="rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Últimos feedbacks</h2>
          <NavLink
            to="/admin/feedbacks"
            className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Ver todos →
          </NavLink>
        </div>
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {recentFeedbacks.length === 0 ? (
            <p className="p-4 text-sm text-surface-400">No hay feedbacks aún</p>
          ) : (
            recentFeedbacks.map((fb) => (
              <div key={fb.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5">
                  {!fb.isRead ? (
                    <Clock size={16} className="text-amber-500" />
                  ) : (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase text-surface-500">{fb.type}</span>
                    <span className="text-xs text-surface-400">
                      {new Date(fb.createdAt).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-surface-700 dark:text-surface-300 line-clamp-2">
                    {fb.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, bg, textColor }: {
  label: string
  value: number
  icon: string
  bg: string
  textColor: string
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${textColor} text-xl`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
    </div>
  )
}