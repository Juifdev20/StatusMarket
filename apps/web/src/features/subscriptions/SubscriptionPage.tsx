import { useEffect, useState, FormEvent } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/authContext';
import { StatusRing } from '../../components/StatusRing';
import type { SubscriptionPlan, Subscription } from '../../types';

export function SubscriptionPage() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [plansRes, subRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('subscriptions').select('*, plan:subscription_plans(*)').eq('seller_id', profile.id).order('created_at', { ascending: false }).limit(1),
      ]);
      if (plansRes.data) setPlans(plansRes.data as SubscriptionPlan[]);
      if (subRes.data && subRes.data.length > 0) setSubscription(subRes.data[0] as Subscription);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  }

  const trialProgress = subscription?.trial_ends_at
    ? Math.min(100, Math.max(0, ((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)) * 100))
    : 0;
  const daysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">Abonnement</h1>

      {subscription?.status === 'TRIAL' && (
        <div className="card flex items-center gap-4 p-4 border-corail-alerte/30">
          <StatusRing progress={trialProgress} size={56} color="#E2572B">
            <div className="flex h-full w-full items-center justify-center bg-corail-alerte/10 rounded-full">
              <span className="font-mono text-xs font-bold text-corail-alerte">{daysLeft}j</span>
            </div>
          </StatusRing>
          <div>
            <p className="text-sm font-semibold text-corail-alerte">Essai PRO en cours</p>
            <p className="text-xs text-brume">{daysLeft} jours restants</p>
          </div>
        </div>
      )}

      {subscription?.status === 'ACTIVE' && (
        <div className="card p-4">
          <span className="badge bg-vert-marche/10 text-vert-marche">{subscription.plan?.name} · Actif</span>
          {subscription.expires_at && (
            <p className="text-xs text-brume mt-2">Expire le {new Date(subscription.expires_at).toLocaleDateString('fr-FR')}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold">{plan.name}</h3>
                <p className="text-xs text-brume mt-1">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-bold text-vert-marche">
                  {plan.price_usd === 0 ? 'Gratuit' : `${plan.price_usd}$`}
                </p>
                {plan.duration_days > 0 && <p className="text-xs text-brume">/ {plan.duration_days} jours</p>}
              </div>
            </div>
            <ul className="mt-4 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-encre-nuit/70 dark:text-sable-chaud/70">
                  <Check size={14} className="text-vert-marche" /> {f}
                </li>
              ))}
            </ul>
            {plan.code !== 'FREE' && plan.code !== 'BUSINESS' && (
              <button
                onClick={() => { setSelectedPlan(plan); setShowPaymentForm(true); }}
                className="btn-cta mt-4 w-full text-xs"
              >
                Passer à {plan.name}
              </button>
            )}
            {plan.code === 'BUSINESS' && (
              <p className="mt-4 text-xs text-brume text-center">Bientôt disponible — contactez-nous</p>
            )}
          </div>
        ))}
      </div>

      {showPaymentForm && selectedPlan && (
        <PaymentForm
          plan={selectedPlan}
          sellerId={profile!.id}
          onClose={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  );
}

function PaymentForm({ plan, sellerId, onClose }: {
  plan: SubscriptionPlan;
  sellerId: string;
  onClose: () => void;
}) {
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const fileName = `${sellerId}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('payment-proofs').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      setProofUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('payments').insert({
      seller_id: sellerId,
      plan_id: plan.id,
      amount: plan.price_usd,
      currency: 'USD',
      status: 'PENDING',
      mode: 'MANUAL',
      proof_image_url: proofUrl,
      reference,
    });
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="card max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vert-marche/10">
            <Check size={24} className="text-vert-marche" />
          </div>
          <h2 className="font-serif text-lg font-bold">Preuve soumise !</h2>
          <p className="text-sm text-brume mt-2">Votre paiement est en attente de validation par l'administrateur.</p>
          <button onClick={onClose} className="btn-primary mt-4 w-full">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none md:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-lg font-bold mb-4">Paiement — Plan {plan.name}</h2>
        <div className="card bg-sable-chaud dark:bg-encre-nuit/40 p-3 mb-4">
          <p className="text-xs text-brume">Effectuez votre paiement ({plan.price_usd}$) via Mobile Money ou virement, puis soumettez la preuve ci-dessous.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Référence / ID de transaction</label>
            <input required value={reference} onChange={(e) => setReference(e.target.value)} className="input" placeholder="EX123456789" />
          </div>
          <div>
            <label className="label">Capture d'écran du paiement</label>
            <input type="file" accept="image/*" required onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="input" />
            {uploading && <p className="text-xs text-brume mt-1">Upload en cours...</p>}
            {proofUrl && <img src={proofUrl} alt="Preuve" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Annuler</button>
            <button type="submit" disabled={submitting || !proofUrl} className="btn-primary flex-1">
              {submitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
