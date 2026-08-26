import { useState, FormEvent } from 'react';
import { X, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ReportModal({ targetType, targetId, onClose }: { targetType: string; targetId: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSending(true);
    await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
    });
    setSending(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-b-none md:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2"><Flag size={18} /> Signaler</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        {done ? (
          <div className="py-8 text-center">
            <p className="text-vert-marche font-medium">Merci, votre signalement a été transmis.</p>
            <button onClick={onClose} className="btn-primary mt-4">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-brume">Décrivez la raison du signalement. Notre équipe examinera sous 24h.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input min-h-[120px]"
              placeholder="Contenu inapproprié, arnaque, contrefaçon..."
              required
            />
            <button type="submit" disabled={sending} className="btn-primary w-full">{sending ? 'Envoi...' : 'Envoyer'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
