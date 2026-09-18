import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';

type CartItem = { product: Product; quantity: number };

export function CartPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<CartItem[]>([]);
  const [store, setStore] = useState<{ id: string; whatsapp_number: string | null; slug: string; name: string } | null>(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('cart');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const cart: CartItem[] = parsed.items || [];
    setItems(cart);
    if (parsed.store) setStore(parsed.store);
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem('cart', JSON.stringify({ store, items: next }));
  };

  const updateQty = (productId: string, delta: number) => {
    const next = items.map((item) =>
      item.product.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    save(next);
  };

  const remove = (productId: string) => {
    const next = items.filter((item) => item.product.id !== productId);
    save(next);
  };

  const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const currency = items[0]?.product.currency || 'USD';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!store || items.length === 0) return;
    if (!customer.phone.trim() || !customer.address.trim()) {
      alert(t('cart.errors.phoneAndAddressRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);

    const orderId = crypto.randomUUID();
    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      store_id: store.id,
      customer_name: customer.name || null,
      customer_phone: customer.phone,
      customer_email: customer.email || null,
      address: customer.address,
      notes: customer.notes || null,
      total,
      currency,
    });

    if (orderError) {
      setError(orderError.message || t('cart.errors.orderFailed'));
      setSubmitting(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      currency: item.product.currency,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      setError(itemsError.message || t('cart.errors.orderFailed'));
      setSubmitting(false);
      return;
    }

    localStorage.removeItem('cart');
    setItems([]);
    setDone(true);
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vert-marche/10">
            <ShoppingCart size={24} className="text-vert-marche" />
          </div>
          <h1 className="font-serif text-2xl font-bold">{t('cart.orderSent')}</h1>
          <p className="mt-2 text-sm text-brume">{t('cart.sellerWillContact')}</p>
          {store && <a href={`https://wa.me/${store.whatsapp_number?.replace(/[^0-9]/g, '') ?? ''}`} className="btn-cta mt-6 inline-flex" target="_blank" rel="noopener noreferrer">{t('cart.contactOnWhatsapp')}</a>}
          <Link to="/" className="btn-outline mt-3 w-full block">{t('auth.backToHome')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit pb-24">
      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-brume/30 bg-white dark:bg-encre-nuit/80 px-4">
        <button onClick={() => navigate(-1)} className="text-brume hover:text-vert-marche">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-serif text-lg font-bold">{t('cart.title')}</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Package size={48} className="text-brume mb-4" />
            <p className="text-brume">{t('cart.empty')}</p>
            <Link to="/" className="btn-primary mt-4">{t('cart.exploreShops')}</Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="card p-3 flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-sable-chaud dark:bg-encre-nuit/40 overflow-hidden">
                    {item.product.image_url && <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.product.name}</p>
                    <p className="font-mono text-sm text-vert-marche">{item.product.price} {item.product.currency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, -1)} className="btn-ghost p-1"><Minus size={14} /></button>
                    <span className="w-4 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="btn-ghost p-1"><Plus size={14} /></button>
                    <button onClick={() => remove(item.product.id)} className="btn-ghost p-1 text-corail-alerte"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>{t('cart.total')}</span>
                <span className="font-mono text-vert-marche">{total} {currency}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-4 space-y-4">
              <h2 className="font-serif text-lg font-bold">{t('cart.deliveryInfo')}</h2>
              <div>
                <label className="label">{t('cart.phoneRequired')}</label>
                <input required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="input" placeholder="+243..." />
              </div>
              <div>
                <label className="label">{t('account.name')}</label>
                <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="input" placeholder={t('cart.yourName')} />
              </div>
              <div>
                <label className="label">{t('cart.addressRequired')}</label>
                <input required value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="input" placeholder={t('cart.addressPlaceholder')} />
              </div>
              <div>
                <label className="label">{t('account.emailLabel')} <span className="text-brume font-normal">({t('common.optional')})</span></label>
                <input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="input" placeholder="vous@exemple.com" />
              </div>
              <div>
                <label className="label">{t('cart.notes')}</label>
                <textarea value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} className="input min-h-[80px]" placeholder={t('cart.notesPlaceholder')} />
              </div>
              {error && (
                <p className="rounded-lg bg-corail-alerte/10 px-3 py-2 text-sm text-corail-alerte">{error}</p>
              )}
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? t('report.sending') : t('cart.confirmOrder')}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
