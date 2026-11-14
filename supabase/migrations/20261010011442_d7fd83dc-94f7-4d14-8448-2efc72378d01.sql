CREATE OR REPLACE FUNCTION public.record_card_payment(_order_id uuid, _attempt_key uuid, _payment_id text, _amount numeric, _payload jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id AND payment_method = 'card' FOR UPDATE;
  IF NOT FOUND OR abs(o.total - _amount) > 0.009 OR _payload->>'external_reference' IS DISTINCT FROM _order_id::text OR _payload->>'payment_type_id' NOT IN ('credit_card','debit_card') THEN RAISE EXCEPTION 'Cobrança divergente.'; END IF;
  UPDATE public.payments SET provider_payment_id = _payment_id, raw_payload = _payload, updated_at = now()
    WHERE order_id = _order_id AND provider = 'mercadopago' AND idempotency_key = _attempt_key
      AND (provider_payment_id IS NULL OR provider_payment_id = _payment_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Tentativa divergente.'; END IF;
  PERFORM public.apply_mercado_pago_payment(_order_id, _payment_id, _payload->>'status', _amount, _payload);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_card_payment(uuid,uuid,text,numeric,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_card_payment(uuid,uuid,text,numeric,jsonb) TO service_role;