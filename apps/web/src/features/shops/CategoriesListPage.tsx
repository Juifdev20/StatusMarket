import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { GlobalCategory } from '../../types';

export function CategoriesListPage() {
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('global_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setCategories((data || []) as GlobalCategory[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-sable-chaud dark:bg-encre-nuit pb-20">
      <div className="sticky top-0 z-50 border-b border-brume/30 bg-white/95 dark:bg-encre-nuit/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Link to="/" className="text-brume hover:text-vert-marche">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-serif text-lg font-bold">Toutes les catégories</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-brume">Aucune catégorie disponible.</div>
        ) : (
          <>
            <p className="text-sm text-brume mb-6">
              Choisissez une catégorie pour découvrir tous les produits des boutiques StatusMarket.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categorie/${cat.slug}`}
                  className="card flex flex-col items-center gap-2 p-4 transition hover:shadow-md hover:border-vert-marche/30"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
