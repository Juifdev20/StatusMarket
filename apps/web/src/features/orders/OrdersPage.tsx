import { useEffect, useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Phone, MapPin, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import type { Store, Order, OrderItem } from '../../types';

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-ambre-pagne/10 text-ambre-pagne',
  CONFIRMED: 'bg-vert-marche/10 text-vert-marche',
  SHIPPED: 'bg-vert-marche/10 text-vert-marche',
  DELIVERED: 'bg-vert-marche/10 text-vert-marche',
  CANCELLED: 'bg-corail-alerte/10 text-corail-alerte',
};

export function OrdersPage() {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: stores } = await supabase.from('stores').select('*').eq('owner_id', profile.id).single();
      if (stores) {
        setStore(stores as Store);
        await loadOrders(stores.id);
      }
      setLoading(false);
    })();
  }, [profile]);

  const loadOrders = async (storeId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    if (store) await loadOrders(store.id);
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  if (!store) {
    return <p className="text-center text-brume py-20">Créez d'abord votre boutique.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Commandes</h1>
        <span className="badge bg-brume/20 text-brume">{orders.length} commande{orders.length > 1 ? 's' : ''}</span>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <ShoppingBag size={48} className="text-brume mb-4" />
          <p className="text-brume">Aucune commande pour le moment.</p>
          <p className="text-xs text-brume mt-2">Les clients passent commande depuis votre boutique publique.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  </div>
                  <p className="text-xs text-brume mt-1">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right mr-2">
                  <p className="font-mono font-bold">{order.total} {order.currency}</p>
                </div>
                {expanded === order.id ? <ChevronUp size={18} className="text-brume" /> : <ChevronDown size={18} className="text-brume" />}
              </button>

              {expanded === order.id && (
                <div className="border-t border-brume/20 p-4 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-brume" />
                      <span>{order.customer_name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-brume" />
                      <span>{order.customer_phone}</span>
                    </div>
                    {order.customer_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-brume">@</span>
                        <span>{order.customer_email}</span>
                      </div>
                    )}
                    {order.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-brume" />
                        <span>{order.address}</span>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <div className="rounded-xl bg-sable-chaud dark:bg-encre-nuit/40 p-3 text-sm">
                      <span className="text-brume">Note :</span> {order.notes}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Articles</h3>
                    {(order.items || []).map((item: OrderItem) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl bg-sable-chaud dark:bg-encre-nuit/40 p-3 text-sm">
                        <div>
                          <p className="font-medium">{item.product?.name || 'Produit'}</p>
                          <p className="text-xs text-brume">Qté: {item.quantity}</p>
                        </div>
                        <p className="font-mono font-semibold">{item.price * item.quantity} {item.currency}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(order.id, s)}
                        className={`badge ${order.status === s ? statusColors[s] : 'bg-brume/20 text-brume'}`}
                      >
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
