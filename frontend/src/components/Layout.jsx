import { NavLink, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const navItems = [
  { to: '/home',      label: 'Home',          icon: '⌂' },
  { to: '/chat',      label: 'AI Assistant',  icon: '🤖' },
  { to: '/dashboard', label: 'Dashboard',     icon: '◈' },
  { to: '/reminders', label: 'Reminders',     icon: '◉' },
  { to: '/calendar',  label: 'Calendar',      icon: '▦' },
  { to: '/upload',    label: 'Upload Report', icon: '↑' },
  { to: '/premium',   label: 'Premium',       icon: '★' },
]

export default function Layout({ children, title = 'Dashboard' }) {
  const navigate = useNavigate()
  const user = authService.getUser()

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="h-[68px] flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-500">caretica</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
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

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[68px] bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
          <h1 className="text-base font-semibold text-gray-800">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
