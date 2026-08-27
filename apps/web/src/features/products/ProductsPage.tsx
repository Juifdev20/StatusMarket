import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Package, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { ShareDialog } from '../../components/ShareDialog';
import type { Store, Product, Category, GlobalCategory } from '../../types';

export function ProductsPage() {
  const { profile, user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [sharingProduct, setSharingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const ownerId = profile?.id || user?.id;
    if (!ownerId) return;
    setLoading(true);
    setFetchError(null);
    let isMounted = true;
    (async () => {
      try {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!isMounted) return;
        if (storeError) {
          console.error('Error fetching store:', storeError);
          setFetchError(storeError.message || 'Erreur de chargement de la boutique');
          return;
        }
        const myStore = storeData ? (storeData as Store) : null;
        setStore(myStore);
        if (myStore) {
          const [prodRes, catRes, gcatRes] = await Promise.all([
            supabase.from('products').select('*, category:categories(*), global_category:global_categories(*)').eq('store_id', myStore.id).order('created_at', { ascending: false }),
            supabase.from('categories').select('*').eq('store_id', myStore.id).order('name'),
            supabase.from('global_categories').select('*').eq('is_active', true).order('sort_order'),
          ]);
          if (isMounted) {
            setProducts((prodRes.data || []) as Product[]);
            setCategories((catRes.data || []) as Category[]);
            setGlobalCategories((gcatRes.data || []) as GlobalCategory[]);
          }
        } else {
          setProducts([]);
          setCategories([]);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setFetchError(err?.message || 'Erreur de chargement de la boutique');
        console.error('Error fetching store:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [profile?.id, user?.id, refresh]);

  const loadProducts = async () => {
    if (!store) return;
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*), global_category:global_categories(*)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });
    setProducts((data || []) as Product[]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await supabase.from('products').delete().eq('id', id);
    await loadProducts();
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center py-20 text-center px-4">
        <Package size={48} className="text-corail-alerte mb-4" />
        <p className="text-corail-alerte mb-4 text-sm">{fetchError}</p>
        <button onClick={() => setRefresh(r => r + 1)} className="btn-primary text-xs">Réessayer</button>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Package size={48} className="text-brume mb-4" />
        <p className="text-brume mb-4">Créez d'abord votre boutique pour gérer vos produits.</p>
      </div>
    );
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
                {p.discount_price && p.discount_price < p.price ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-corail-alerte">{p.discount_price} {p.currency}</span>
                    <span className="font-mono text-[10px] text-brume line-through">{p.price}</span>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-vert-marche">{p.price} {p.currency}</p>
                )}
                {p.global_category && <span className="badge bg-vert-marche/10 text-vert-marche mt-1">{p.global_category.icon} {p.global_category.name}</span>}
                {p.category && <span className="badge bg-brume/20 text-brume mt-1 ml-1">{p.category.name}</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setSharingProduct(p)} className="btn-ghost p-2" title="Partager">
                  <Share2 size={16} />
                </button>
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
          globalCategories={globalCategories}
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadProducts(); }}
        />
      )}

      {sharingProduct && store && (
        <ShareDialog
          product={sharingProduct}
          store={store}
          onClose={() => setSharingProduct(null)}
          onPreviewImageChange={(imgUrl) => {
            setProducts((prev) => prev.map((p) => p.id === sharingProduct.id ? { ...p, share_preview_image_url: imgUrl } : p));
          }}
        />
      )}
    </div>
  );
}

function ProductForm({ store, categories, globalCategories, product, onClose, onSaved }: {
  store: Store;
  categories: Category[];
  globalCategories: GlobalCategory[];
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price?.toString() ?? '');
  const [currency, setCurrency] = useState(product?.currency ?? 'USD');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '');
  const [globalCategoryId, setGlobalCategoryId] = useState(product?.global_category_id ?? '');
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0');
  const [discountPrice, setDiscountPrice] = useState(product?.discount_price?.toString() ?? '');
  const [isPromoted, setIsPromoted] = useState(product?.is_promoted ?? false);
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
      global_category_id: globalCategoryId || null,
      name,
      description: description || null,
      price: parseFloat(price),
      discount_price: discountPrice ? parseFloat(discountPrice) : null,
      is_promoted: isPromoted,
      currency,
      image_url: imageUrl || null,
      is_available: isAvailable,
      stock: parseInt(stock) || 0,
    };
    if (product) {
      await supabase.from('products').update(payload).eq('id', product.id);
    } else {
      await supabase.from('products').insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
      <div className="card h-[100dvh] w-full max-w-md flex flex-col rounded-b-none md:h-auto md:max-h-[85vh] md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-brume/10 p-4 md:p-6 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold">{product ? 'Modifier' : 'Nouveau'} produit</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
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
              <select value={globalCategoryId} onChange={(e) => setGlobalCategoryId(e.target.value)} className="input">
                <option value="">Choisir une catégorie...</option>
                {globalCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sous-catégorie (optionnel)</label>
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
            <div>
              <label className="label">Prix promo (optionnel)</label>
              <input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="input" placeholder="Laisser vide si pas de promo" />
              {discountPrice && parseFloat(discountPrice) > 0 && parseFloat(discountPrice) < parseFloat(price) && (
                <p className="text-xs text-corail-alerte mt-1">Promo: -{Math.round((1 - parseFloat(discountPrice) / parseFloat(price)) * 100)}%</p>
              )}
            </div>
            <div>
              <label className="label">Mettre en avant (promotion)</label>
              <select value={isPromoted ? 'yes' : 'no'} onChange={(e) => setIsPromoted(e.target.value === 'yes')} className="input">
                <option value="no">Non</option>
                <option value="yes">Oui</option>
              </select>
            </div>
          </div>
          <div className="sticky bottom-0 border-t border-brume/10 bg-inherit p-4 md:p-6 flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
