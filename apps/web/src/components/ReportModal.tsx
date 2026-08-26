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
      <div className="card max-h-[85vh] w-full max-w-md flex flex-col rounded-b-none md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-brume/10 p-4 md:p-6 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2"><Flag size={18} /> Signaler</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        {done ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 text-center">
              <p className="text-vert-marche font-medium">Merci, votre signalement a été transmis.</p>
            </div>
            <div className="border-t border-brume/10 p-4 md:p-6">
              <button onClick={onClose} className="btn-primary w-full">Fermer</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <p className="text-sm text-brume">Décrivez la raison du signalement. Notre équipe examinera sous 24h.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input min-h-[120px]"
                placeholder="Contenu inapproprié, arnaque, contrefaçon..."
                required
              />
            </div>
            <div className="sticky bottom-0 border-t border-brume/10 bg-inherit p-4 md:p-6">
              <button type="submit" disabled={sending} className="btn-primary w-full">{sending ? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
