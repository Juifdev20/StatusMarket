import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';

type CartItem = { product: Product; quantity: number };

export function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [store, setStore] = useState<{ id: string; whatsapp_number: string | null; slug: string; name: string } | null>(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
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
      alert('Le numéro de téléphone et l\'adresse complète sont obligatoires pour la livraison.');
      return;
    }
    setSubmitting(true);

    const { data: orderData } = await supabase.from('orders').insert({
      store_id: store.id,
      customer_name: customer.name || null,
      customer_phone: customer.phone,
      customer_email: customer.email || null,
      address: customer.address,
      notes: customer.notes || null,
      total,
      currency,
    }).select('id').single();

    if (orderData) {
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        currency: item.product.currency,
      }));
      await supabase.from('order_items').insert(orderItems);
      localStorage.removeItem('cart');
      setItems([]);
      setDone(true);
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vert-marche/10">
            <ShoppingCart size={24} className="text-vert-marche" />
          </div>
          <h1 className="font-serif text-2xl font-bold">Commande envoyée !</h1>
          <p className="mt-2 text-sm text-brume">Le vendeur vous contactera par WhatsApp pour confirmer.</p>
          {store && <a href={`https://wa.me/${store.whatsapp_number?.replace(/[^0-9]/g, '') ?? ''}`} className="btn-cta mt-6 inline-flex" target="_blank" rel="noopener noreferrer">Contacter sur WhatsApp</a>}
          <Link to="/" className="btn-outline mt-3 w-full block">Retour à l'accueil</Link>
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
        <h1 className="font-serif text-lg font-bold">Panier</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Package size={48} className="text-brume mb-4" />
            <p className="text-brume">Votre panier est vide.</p>
            <Link to="/" className="btn-primary mt-4">Explorer les boutiques</Link>
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
                <span>Total</span>
                <span className="font-mono text-vert-marche">{total} {currency}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-4 space-y-4">
              <h2 className="font-serif text-lg font-bold">Informations de livraison</h2>
              <div>
                <label className="label">Téléphone *</label>
                <input required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="input" placeholder="+243..." />
              </div>
              <div>
                <label className="label">Nom</label>
                <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="input" placeholder="Votre nom" />
              </div>
              <div>
                <label className="label">Adresse complète *</label>
                <input required value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="input" placeholder="Quartier, avenue, numéro de porte..." />
              </div>
              <div>
                <label className="label">Email <span className="text-brume font-normal">(optionnel)</span></label>
                <input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="input" placeholder="vous@exemple.com" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} className="input min-h-[80px]" placeholder="Couleur, taille..." />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Envoi...' : 'Confirmer la commande'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
