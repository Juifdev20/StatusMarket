-- ============================================================================
-- Migration 021 — Payment status & subscription expiry notifications
-- ============================================================================

-- Notify seller when payment status changes (approved or rejected)
CREATE OR REPLACE FUNCTION public.notify_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'APPROVED' THEN
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (
        NEW.seller_id,
        'Paiement approuvé',
        'Votre paiement a été approuvé. Votre abonnement est maintenant actif.',
        '/vendeur/abonnement'
      );
    ELSIF NEW.status = 'REJECTED' THEN
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (
        NEW.seller_id,
        'Paiement rejeté',
        COALESCE('Votre paiement a été rejeté. Raison: ' || NEW.rejection_reason, 'Votre paiement a été rejeté. Veuillez réessayer.'),
        '/vendeur/abonnement'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_notify_status ON public.payments;
CREATE TRIGGER payments_notify_status
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_status();

-- Notify seller when subscription expires
CREATE OR REPLACE FUNCTION public.notify_subscription_expired()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'EXPIRED' THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.seller_id,
      'Abonnement expiré',
      'Votre abonnement a expiré. Renouvelez-le pour continuer à vendre.',
      '/vendeur/abonnement'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_notify_expired ON public.subscriptions;
CREATE TRIGGER subscriptions_notify_expired
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_subscription_expired();
