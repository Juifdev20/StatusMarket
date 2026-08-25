import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/authContext';
import type { Store, Category } from '../../types';

export function CategoriesPage() {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const stores = await api.getMyShops();
        const myStore = (stores || [])[0] as Store | undefined;
        if (myStore) {
          setStore(myStore);
          const res = await api.getCategories(myStore.id);
          setCategories((res || []) as Category[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const load = async () => {
    if (!store) return;
    const res = await api.getCategories(store.id);
    setCategories((res || []) as Category[]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!store || !name.trim()) return;
    setSaving(true);
    const slug = slugify(name);
    try {
      if (editing) {
        await api.updateCategory(editing.id, { name: name.trim(), slug });
      } else {
        await api.createCategory({ store_id: store.id, name: name.trim(), slug });
      }
      setName('');
      setEditing(null);
      await load();
    } catch {
      // ignored
    }
    setSaving(false);
  };

  const handleEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.deleteCategory(id);
      await load();
    } catch {
      // ignored
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setName('');
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  if (!store) {
    return <p className="text-center text-brume py-20">Créez d'abord votre boutique.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">Catégories</h1>

      <form onSubmit={handleSubmit} className="card p-4 space-y-4">
        <div>
          <label className="label">{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input flex-1"
              placeholder="Ex: Chaussures"
            />
            <button type="submit" disabled={saving} className="btn-primary">
              {editing ? <Pencil size={16} /> : <Plus size={16} />}
              {editing ? 'Modifier' : 'Ajouter'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="btn-ghost px-3">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Tag size={48} className="text-brume mb-4" />
          <p className="text-brume">Aucune catégorie. Ajoutez-en pour mieux organiser vos produits.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-brume">/{c.slug}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(c)} className="btn-ghost p-2">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="btn-ghost p-2 text-corail-alerte">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
