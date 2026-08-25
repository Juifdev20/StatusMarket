import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import type { Store, Product, Category } from '../../types';

export function ProductsPage() {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const stores = await api.getMyShops();
        const myStore = (stores || [])[0] as Store | undefined;
        if (myStore) {
          setStore(myStore);
          const [prodRes, catRes] = await Promise.all([
            api.getProducts(myStore.id),
            api.getCategories(myStore.id),
          ]);
          setProducts((prodRes || []) as Product[]);
          setCategories((catRes || []) as Category[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const loadProducts = async () => {
    if (!store) return;
    const res = await api.getProducts(store.id);
    setProducts((res || []) as Product[]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch {
      // ignored
    }
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  if (!store) {
    return <p className="text-center text-brume py-20">Créez d'abord votre boutique.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Produits</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-primary text-xs"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Package size={48} className="text-brume mb-4" />
          <p className="text-brume mb-4">Aucun produit. Ajoutez votre premier produit !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-3">
              <div className="h-14 w-14 shrink-0 rounded-lg bg-sable-chaud dark:bg-encre-nuit/40 overflow-hidden">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="font-mono text-xs text-vert-marche">{p.price} {p.currency}</p>
                {p.category && <span className="badge bg-brume/20 text-brume mt-1">{p.category.name}</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(p); setShowForm(true); }} className="btn-ghost p-2">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="btn-ghost p-2 text-corail-alerte">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          store={store}
          categories={categories}
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadProducts(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ store, categories, product, onClose, onSaved }: {
  store: Store;
  categories: Category[];
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price?.toString() ?? '');
  const [currency, setCurrency] = useState(product?.currency ?? 'USD');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '');
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${store.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file);
    if (!upErr) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      store_id: store.id,
      category_id: categoryId || null,
      name,
      description: description || null,
      price: parseFloat(price),
      currency,
      image_url: imageUrl || null,
      is_available: isAvailable,
      stock: parseInt(stock) || 0,
    };
    try {
      if (product) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setSaving(false);
      onSaved();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none md:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold">{product ? 'Modifier' : 'Nouveau'} produit</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Nom du produit" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px]" placeholder="Description du produit" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prix</label>
              <input required type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="label">Devise</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              <option value="">Aucune</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Image</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="input" />
            {uploading && <p className="text-xs text-brume mt-1">Upload en cours...</p>}
            {imageUrl && <img src={imageUrl} alt="Aperçu" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Stock</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Disponible</label>
              <select value={isAvailable ? 'yes' : 'no'} onChange={(e) => setIsAvailable(e.target.value === 'yes')} className="input">
                <option value="yes">Oui</option>
                <option value="no">Non</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
