import { useState } from 'react'
import { CategoryTree } from '../categories/CategoryTree'
import { useAuthStore } from '../../hooks/useAuthStore'
import { LogOut, Settings, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { SettingsDialog } from '../settings/SettingsDialog'
import { WarningDialog } from '../warnings/WarningDialog'

interface SidebarProps {
  selectedCategoryId: string | null
  onSelectCategory: (id: string) => void
  /** When provided, sidebar renders as a mobile drawer */
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ selectedCategoryId, onSelectCategory, open, onClose }: SidebarProps) {
  const { user, signOut } = useAuthStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const profileName = typeof user?.profile?.name === 'string' ? user.profile.name : ''
  const profileAvatarUrl = typeof user?.profile?.avatarUrl === 'string' ? user.profile.avatarUrl : ''
  const avatarUrl = profileAvatarUrl || `https://api.dicebear.com/8.x/identicon/svg?seed=${user?.email}`
  const displayName = profileName || user?.email

  const isDrawer = open !== undefined

  const handleSelect = (id: string) => {
    onSelectCategory(id)
    onClose?.()
  }

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto">
        <CategoryTree
          key={user?.id ?? 'anonymous'}
          selectedId={selectedCategoryId}
          onSelect={handleSelect}
        />
      </div>

      <footer className="border-t border-surface-200 dark:border-surface-800 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt="User avatar"
            className="w-8 h-8 rounded-full bg-surface-200 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
              {displayName}
            </p>
            {profileName && (
              <p className="text-xs text-surface-400 truncate">{user?.email}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} title="Ajustes">
            <Settings size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLogoutOpen(true)} title="Cerrar sesión">
            <LogOut size={18} />
          </Button>
        </div>
      </footer>
    </>
  )

  const drawerContent = (
    <>
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-surface-200 dark:border-surface-800">
        <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">Navegación</span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-200"
        >
          <X size={18} />
        </button>
      </div>
      {sidebarContent}
    </>
  )

  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden sm:flex sm:w-80 lg:w-72 shrink-0 bg-surface-50 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex-col h-full">
        {sidebarContent}
      </aside>

      {/* Mobile: drawer overlay */}
      {isDrawer && (
        <>
          {open && (
            <div
              className="fixed inset-0 z-40 bg-black/40 sm:hidden"
              onClick={onClose}
            />
          )}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] bg-surface-50 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col h-full transform transition-transform duration-200 sm:hidden ${
              open ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {drawerContent}
          </aside>
        </>
      )}

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <WarningDialog
        open={logoutOpen}
        title="Cerrar sesión"
        heading="¿Cerrar tu sesión?"
        message="Vas a salir de tu cuenta en este dispositivo."
        confirmLabel="Cerrar sesión"
        pendingLabel="Cerrando..."
        confirmVariant="default"
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false)
          signOut()
        }}
      />
    </>
  )
}
