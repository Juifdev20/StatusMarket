import { ReactNode, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Store, Package, CreditCard, Settings, Flag, BarChart3, Menu, X, LogOut } from 'lucide-react';

import { useAuth } from '../features/auth/authContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { NotificationsDropdown } from '../components/NotificationsDropdown';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/vendeurs', icon: Users, label: 'Vendeurs', end: false },
  { to: '/admin/boutiques', icon: Store, label: 'Boutiques', end: false },
  { to: '/admin/produits', icon: Package, label: 'Produits', end: false },
  { to: '/admin/paiements', icon: CreditCard, label: 'Paiements', end: false },
  { to: '/admin/abonnements', icon: BarChart3, label: 'Abonnements', end: false },
  { to: '/admin/signalements', icon: Flag, label: 'Signalements', end: false },
  { to: '/admin/parametres', icon: Settings, label: 'Paramètres', end: false },
];

export function AdminLayout({ children }: { children?: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-brume/30 bg-white dark:bg-encre-nuit/80 lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-brume/30 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-vert-marche/10">
            <LayoutDashboard size={18} className="text-vert-marche" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold text-vert-marche leading-none">StatusMarket</span>
            <p className="text-[10px] text-brume">Administration</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-vert-marche/10 text-vert-marche'
                      : 'text-encre-nuit/70 hover:bg-encre-nuit/5 dark:text-sable-chaud/70 dark:hover:bg-white/5'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-brume/30 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-encre-nuit/5 dark:bg-white/5 px-4 py-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-vert-marche/10 text-vert-marche font-bold text-xs">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-xs text-brume truncate">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-corail-alerte hover:bg-corail-alerte/10 transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-encre-nuit">
            <div className="flex h-16 items-center justify-between border-b border-brume/30 px-6">
              <span className="font-serif text-lg font-bold text-vert-marche">Admin</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" onClick={() => setSidebarOpen(false)}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
                        isActive ? 'bg-vert-marche/10 text-vert-marche' : 'text-encre-nuit/70'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile header */}
      <div className="flex h-16 items-center gap-3 border-b border-brume/30 bg-white dark:bg-encre-nuit/80 px-4 lg:hidden">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="font-serif text-lg font-bold text-vert-marche">StatusMarket Admin</span>
      </div>

      {/* Desktop top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 hidden h-16 items-center justify-between border-b border-brume/30 bg-white/95 dark:bg-encre-nuit/95 px-8 backdrop-blur lg:left-64 lg:flex">
        <h1 className="font-serif text-lg font-bold text-encre-nuit dark:text-sable-chaud">Panneau d'administration</h1>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <ThemeToggle />
          <div className="flex items-center gap-3 rounded-xl bg-encre-nuit/5 dark:bg-white/5 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vert-marche/10 text-vert-marche font-bold text-xs">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-sm font-medium">{profile?.full_name || 'Admin'}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen lg:ml-64 pt-0 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
