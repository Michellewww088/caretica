import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const navItems = [
  { to: '/home',      label: 'Home',          icon: '⌂' },
  { to: '/chat',      label: 'AI Assistant',  icon: '🤖' },
  { to: '/dashboard', label: 'Dashboard',     icon: '◈' },
  { to: '/report',     label: 'Growth Report', icon: '📋' },
  { to: '/milestones', label: 'Milestones',   icon: '🎯' },
  { to: '/reminders',  label: 'Reminders',    icon: '◉' },
  { to: '/calendar',  label: 'Calendar',      icon: '▦' },
  { to: '/upload',    label: 'Upload Record', icon: '↑' },
  { to: '/premium',   label: 'Premium',       icon: '★' },
]

export default function Layout({ children, title = 'Dashboard' }) {
  const navigate = useNavigate()
  const user = authService.getUser()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <>
      <div className="h-[68px] flex items-center px-6 border-b border-gray-100 shrink-0">
        <span className="text-xl font-bold text-blue-500">caretica</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100 shrink-0">
        <p className="text-xs font-medium text-gray-600 truncate">{user?.name}</p>
        <p className="text-xs text-gray-400 truncate mb-3">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Desktop sidebar (always visible md+) ── */}
      <aside className="hidden md:flex w-[240px] bg-white border-r border-gray-100 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[240px] bg-white border-r border-gray-100 flex flex-col z-40 md:hidden transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-[68px] bg-white border-b border-gray-100 flex items-center px-4 md:px-6 gap-3 shrink-0">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <span className="block w-5 h-0.5 bg-gray-600 rounded" />
            <span className="block w-5 h-0.5 bg-gray-600 rounded" />
            <span className="block w-5 h-0.5 bg-gray-600 rounded" />
          </button>
          <h1 className="text-base font-semibold text-gray-800 truncate">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
