import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { Home, Package, CirclePlus, ShoppingBag, User, LogOut, Menu, X, Store, Tag, Newspaper } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ThemeToggle } from '../components/ThemeToggle';
import { NotificationsDropdown } from '../components/NotificationsDropdown';
import { useAuth } from '../features/auth/authContext';

const navItems = [
  { to: '/vendeur', icon: Home, label: 'Tableau de bord', end: true },
  { to: '/vendeur/produits', icon: Package, label: 'Produits', end: false },
  { to: '/vendeur/categories', icon: Tag, label: 'Catégories', end: false },
  { to: '/vendeur/statut', icon: CirclePlus, label: 'Nouvelle pub', end: false },
  { to: '/vendeur/publications', icon: Newspaper, label: 'Publications', end: false },
  { to: '/vendeur/commandes', icon: ShoppingBag, label: 'Commandes', end: false },
  { to: '/vendeur/compte', icon: User, label: 'Compte', end: false },
];

export function VendorLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/connexion', { replace: true });
  };

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-brume/30 bg-white dark:bg-encre-nuit/80 lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-brume/30 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-vert-marche/10">
            <Store size={18} className="text-vert-marche" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold text-vert-marche leading-none">StatusMarket</span>
            <p className="text-[10px] text-brume">Vendeur</p>
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
              {profile?.full_name?.[0]?.toUpperCase() ?? 'V'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Vendeur'}</p>
              <p className="text-xs text-brume truncate">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
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
              <span className="font-serif text-lg font-bold text-vert-marche">Vendeur</span>
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

      {/* Top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-brume/30 bg-white/95 dark:bg-encre-nuit/95 px-4 backdrop-blur lg:left-64 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-encre-nuit dark:text-sable-chaud" />
          </button>
          <span className="font-serif text-lg font-bold text-vert-marche">StatusMarket</span>
        </div>
        <div className="hidden lg:block">
          <h1 className="font-serif text-lg font-bold text-encre-nuit dark:text-sable-chaud">Espace vendeur</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <ThemeToggle />
          <Link to="/" className="text-sm text-brume hover:text-vert-marche transition-colors hidden sm:block">
            Voir le site
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen lg:ml-64 pt-16">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
