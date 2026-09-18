import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Home, Package, CirclePlus, ShoppingBag, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatusRing } from './StatusRing';

export interface BottomNavTab {
  to: string;
  icon: LucideIcon;
  label: string;
  end: boolean;
  elevated?: boolean;
}

interface BottomNavProps {
  tabs?: BottomNavTab[];
}

export function BottomNav({ tabs }: BottomNavProps) {
  const { t } = useTranslation();
  const resolvedTabs: BottomNavTab[] = tabs ?? [
    { to: '/vendeur', icon: Home, label: t('nav.home'), end: true },
    { to: '/vendeur/produits', icon: Package, label: t('products.title'), end: false },
    { to: '/vendeur/statut', icon: CirclePlus, label: t('vendorNav.status'), end: false, elevated: true },
    { to: '/vendeur/commandes', icon: ShoppingBag, label: t('orders.title'), end: false },
    { to: '/vendeur/compte', icon: User, label: t('vendorNav.account'), end: false },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brume/30 bg-white dark:bg-encre-nuit md:hidden">
      <div className="flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {resolvedTabs.map((tab) => {
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
