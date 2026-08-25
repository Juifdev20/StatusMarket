import { useEffect, useState } from 'react';
import { BarChart3, Save, Check } from 'lucide-react';
import { api } from '../../lib/api';
import type { SubscriptionPlan } from '../../types';

export function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<SubscriptionPlan>>({});
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getPlans();
        setPlans((data || []).sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sort_order - b.sort_order));
      } catch {
        // keep empty
      }
      setLoading(false);
    })();
  }, []);

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setEditValues({
      name: plan.name,
      description: plan.description,
      price_usd: plan.price_usd,
      duration_days: plan.duration_days,
      max_products: plan.max_products,
      max_stores: plan.max_stores,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    });
    setSavedId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const savePlan = async (id: string) => {
    setSaving(true);
    try {
      const updated = await api.updatePlan(id, editValues);
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      setEditingId(null);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      // ignored
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Abonnements & Plans</h1>
        <span className="badge bg-brume/20 text-brume">{plans.length} plan{plans.length > 1 ? 's' : ''}</span>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <BarChart3 size={48} className="text-brume mb-4" />
          <p className="text-brume">Aucun plan d'abonnement trouvé.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isEditing = editingId === plan.id;
            return (
              <div key={plan.id} className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {savedId === plan.id && <Check size={18} className="text-vert-marche" />}
                    {isEditing ? (
                      <input
                        value={editValues.name ?? ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        className="input text-sm font-semibold"
                      />
                    ) : (
                      <h3 className="font-serif text-lg font-bold">{plan.name}</h3>
                    )}
                  </div>
                  <button
                    onClick={() => isEditing ? cancelEdit() : startEdit(plan)}
                    className="text-xs text-vert-marche hover:underline"
                  >
                    {isEditing ? 'Annuler' : 'Modifier'}
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-brume">Description</label>
                      <textarea
                        value={editValues.description ?? ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
                        className="input text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-brume">Prix (USD)</label>
                        <input
                          type="number"
                          value={editValues.price_usd ?? 0}
                          onChange={(e) => setEditValues((v) => ({ ...v, price_usd: Number(e.target.value) }))}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-brume">Durée (jours)</label>
                        <input
                          type="number"
                          value={editValues.duration_days ?? 0}
                          onChange={(e) => setEditValues((v) => ({ ...v, duration_days: Number(e.target.value) }))}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-brume">Max produits</label>
                        <input
                          type="number"
                          value={editValues.max_products ?? 0}
                          onChange={(e) => setEditValues((v) => ({ ...v, max_products: e.target.value ? Number(e.target.value) : null }))}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-brume">Max boutiques</label>
                        <input
                          type="number"
                          value={editValues.max_stores ?? 0}
                          onChange={(e) => setEditValues((v) => ({ ...v, max_stores: Number(e.target.value) }))}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-brume">Ordre</label>
                        <input
                          type="number"
                          value={editValues.sort_order ?? 0}
                          onChange={(e) => setEditValues((v) => ({ ...v, sort_order: Number(e.target.value) }))}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-brume">Actif</label>
                        <select
                          value={editValues.is_active ? 'true' : 'false'}
                          onChange={(e) => setEditValues((v) => ({ ...v, is_active: e.target.value === 'true' }))}
                          className="input text-sm"
                        >
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => savePlan(plan.id)}
                      disabled={saving}
                      className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Enregistrer
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-brume">{plan.description ?? '—'}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brume">Prix</span>
                        <span className="font-mono font-semibold">{plan.price_usd === 0 ? 'Gratuit' : `${plan.price_usd} $`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brume">Durée</span>
                        <span>{plan.duration_days} jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brume">Max produits</span>
                        <span>{plan.max_products ?? 'Illimité'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brume">Max boutiques</span>
                        <span>{plan.max_stores}</span>
                      </div>
                    </div>
                    {plan.features.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-brume">Fonctionnalités</p>
                        {plan.features.map((f, i) => (
                          <p key={i} className="text-xs flex items-center gap-1">
                            <Check size={12} className="text-vert-marche" /> {f}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-brume/20">
                      <span className={`badge ${plan.is_active ? 'bg-vert-marche/10 text-vert-marche' : 'bg-brume/20 text-brume'}`}>
                        {plan.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      <span className="text-xs text-brume">Ordre: {plan.sort_order}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
