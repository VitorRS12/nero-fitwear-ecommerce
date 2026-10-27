BEGIN;

REVOKE ALL ON FUNCTION public.begin_card_payment(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_card_payment(uuid, uuid, text, numeric, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

DROP INDEX IF EXISTS public.payments_one_mercadopago_per_order;

COMMIT;