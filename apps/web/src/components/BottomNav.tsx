import { NavLink } from 'react-router-dom';
import { Home, Package, CirclePlus, ShoppingBag, User } from 'lucide-react';
import { StatusRing } from './StatusRing';

const tabs = [
  { to: '/vendeur', icon: Home, label: 'Accueil', end: true },
  { to: '/vendeur/produits', icon: Package, label: 'Produits', end: false },
  { to: '/vendeur/statut', icon: CirclePlus, label: 'Statut', end: false, elevated: true },
  { to: '/vendeur/commandes', icon: ShoppingBag, label: 'Commandes', end: false },
  { to: '/vendeur/compte', icon: User, label: 'Compte', end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brume/30 bg-white dark:bg-encre-nuit md:hidden">
      <div className="flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          if (tab.elevated) {
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className="flex flex-col items-center gap-0.5"
              >
                {({ isActive }) => (
                  <>
                    <div className="-mt-6">
                      <StatusRing
                        progress={isActive ? 100 : 0}
                        size={56}
                        strokeWidth={3}
                        color="#E2A33B"
                      >
                        <div className="flex h-full w-full items-center justify-center bg-ambre-pagne rounded-full">
                          <Icon size={24} className="text-encre-nuit" />
                        </div>
                      </StatusRing>
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-ambre-pagne' : 'text-brume'}`}>
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="flex flex-1 flex-col items-center gap-0.5 py-2"
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} className={isActive ? 'text-vert-marche' : 'text-brume'} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-vert-marche' : 'text-brume'}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
