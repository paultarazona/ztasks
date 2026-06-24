import { useQuery } from '@tanstack/react-query'
import * as feedbackService from '../../services/feedbackService'
import { Users, Shield, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'

interface UserProfile {
  userId: string
  email: string | null
  lastLogin: string | null
  isActive: boolean
  metadata: Record<string, unknown>
  createdAt: string
}

export function AdminUsers() {
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => feedbackService.getAdminUsers() as Promise<UserProfile[]>,
  })

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Usuarios</h1>
          <p className="text-sm text-surface-500 mt-1">Gestión de usuarios registrados</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={16} className="mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-50 dark:bg-surface-900">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-surface-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-surface-500">Último login</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-surface-500">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-surface-500">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-surface-500">Cargando...</td>
              </tr>
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-surface-400">No hay usuarios</td>
              </tr>
            ) : (
              users?.map((user) => (
                <tr key={user.userId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                        <Users size={14} className="text-surface-500" />
                      </div>
                      <span className="text-sm text-surface-700 dark:text-surface-200">{user.email ?? user.userId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-500">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString('es-AR')
                      : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                      <Shield size={12} />
                      Usuario
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
