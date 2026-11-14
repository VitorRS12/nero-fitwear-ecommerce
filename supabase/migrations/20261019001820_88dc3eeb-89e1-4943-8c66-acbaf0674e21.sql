ALTER TABLE public.payments ALTER COLUMN provider SET DEFAULT 'stripe';

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_uidx
  ON public.payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.apply_stripe_payment(
  _order_id uuid, _payment_intent_id text, _stripe_status text,
  _amount numeric, _method text, _raw_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _order public.orders%ROWTYPE; _new payment_status; _item record;
BEGIN
  SELECT * INTO _order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found'); END IF;
  IF abs(_order.total - _amount) > 0.009 THEN RETURN jsonb_build_object('ok', false, 'reason', 'amount_mismatch'); END IF;
  _new := CASE _stripe_status WHEN 'succeeded' THEN 'approved'::payment_status
    WHEN 'canceled' THEN 'cancelled'::payment_status
    WHEN 'requires_payment_method' THEN 'rejected'::payment_status
    ELSE 'pending'::payment_status END;
  INSERT INTO public.payments (order_id, provider, provider_payment_id, method, status, amount, raw_payload)
  VALUES (_order_id, 'stripe', _payment_intent_id, _method, _new, _amount, _raw_payload)
  ON CONFLICT (provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL
  DO UPDATE SET status = EXCLUDED.status, method = COALESCE(EXCLUDED.method, payments.method),
    raw_payload = EXCLUDED.raw_payload, updated_at = now();
  IF _order.payment_status = 'approved' THEN RETURN jsonb_build_object('ok', true, 'status', 'approved'); END IF;
  IF _new = 'approved' THEN
    IF _order.inventory_released_at IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'released_before_payment');
    END IF;
    UPDATE public.orders SET payment_status = 'approved', status = 'paid',
      payment_method = COALESCE(_method, payment_method), updated_at = now() WHERE id = _order_id;
    FOR _item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = _order_id AND variant_id IS NOT NULL LOOP
      INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity, note)
      VALUES (_item.variant_id, _order_id, 'commit', _item.quantity, 'Pagamento aprovado pelo Stripe');
    END LOOP;
    INSERT INTO public.order_status_history (order_id, status, note) VALUES (_order_id, 'paid', 'Pagamento confirmado pelo Stripe');
  ELSIF _new = 'cancelled' AND _order.payment_status = 'pending' THEN
    PERFORM public.release_order_reservation(_order_id);
  END IF;
  RETURN jsonb_build_object('ok', true, 'status', _new);
END; $$;

REVOKE ALL ON FUNCTION public.apply_stripe_payment(uuid, text, text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_payment(uuid, text, text, numeric, text, jsonb) TO service_role;