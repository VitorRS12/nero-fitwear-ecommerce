DO $$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.create_pending_order(uuid,text,text,text,jsonb,text,text,text,jsonb,uuid)'::regprocedure) INTO definition;
  definition := replace(definition, 'IF _payment_method <> ''pix'' THEN', 'IF _payment_method NOT IN (''pix'', ''card'') THEN');
  definition := replace(definition, 'computed_total, ''pix'', ''awaiting_payment''', 'computed_total, _payment_method, ''awaiting_payment''');
  definition := replace(definition, '''Reserva aguardando PIX''', '''Reserva aguardando pagamento''');
  definition := replace(definition, 'BEGIN' || chr(10) || '  SELECT * INTO new_order', 'BEGIN' || chr(10) || '  PERFORM pg_advisory_xact_lock(hashtextextended(_checkout_key::text, 0));' || chr(10) || '  SELECT * INTO new_order');
  EXECUTE definition;
  SELECT pg_get_functiondef('public.apply_mercado_pago_payment(uuid,text,text,numeric,jsonb)'::regprocedure) INTO definition;
  definition := replace(definition, 'order_row.payment_method <> ''pix''', 'order_row.payment_method NOT IN (''pix'', ''card'')');
  definition := replace(definition, 'Pedido PIX não encontrado.', 'Pedido não encontrado.');
  definition := replace(definition, 'PIX aprovado pelo Mercado Pago', 'Pagamento aprovado pelo Mercado Pago');
  EXECUTE definition;
  SELECT pg_get_functiondef('public.release_expired_pix_orders()'::regprocedure) INTO definition;
  definition := replace(definition, 'WHERE status = ''awaiting_payment''', 'WHERE payment_method = ''pix'' AND status = ''awaiting_payment''');
  EXECUTE definition;
END $$;

CREATE OR REPLACE FUNCTION public.begin_card_payment(_order_id uuid, _user_id uuid, _attempt_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE; p public.payments%ROWTYPE; item record; retry boolean := false;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id AND user_id = _user_id AND payment_method = 'card' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido de cartão não encontrado.'; END IF;
  SELECT * INTO p FROM public.payments WHERE order_id = o.id AND provider = 'mercadopago' FOR UPDATE;
  IF FOUND THEN
    IF p.idempotency_key = _attempt_key OR p.status IN ('pending', 'approved') THEN
      RETURN jsonb_build_object('attemptKey', p.idempotency_key, 'paymentId', p.provider_payment_id, 'status', p.status);
    END IF;
    IF p.status <> 'rejected' OR o.payment_status = 'approved' THEN RAISE EXCEPTION 'Este pedido já foi encerrado.'; END IF;
    retry := true;
  ELSE
    IF o.status <> 'awaiting_payment' OR o.payment_expires_at <= now() OR o.inventory_released_at IS NOT NULL THEN RAISE EXCEPTION 'Pedido expirado. Inicie uma nova compra.'; END IF;
  END IF;
  IF retry THEN
    FOR item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = o.id ORDER BY variant_id LOOP
      UPDATE public.product_variants SET stock = stock - item.quantity WHERE id = item.variant_id AND stock >= item.quantity AND is_active;
      IF NOT FOUND THEN RAISE EXCEPTION 'Estoque insuficiente para tentar novamente.'; END IF;
      INSERT INTO public.inventory_movements(variant_id, order_id, type, quantity, note) VALUES(item.variant_id, o.id, 'reserve', item.quantity, 'Nova tentativa de cartão após recusa');
    END LOOP;
    IF o.coupon_code IS NOT NULL THEN
      UPDATE public.coupons SET used_count = used_count + 1 WHERE upper(code) = upper(o.coupon_code) AND is_active AND (expires_at IS NULL OR expires_at > now()) AND (max_uses IS NULL OR used_count < max_uses);
      IF NOT FOUND THEN RAISE EXCEPTION 'Cupom indisponível. Inicie uma nova compra.'; END IF;
    END IF;
  END IF;
  INSERT INTO public.payments(order_id, provider, method, status, amount, idempotency_key)
    VALUES(o.id, 'mercadopago', 'card', 'pending', o.total, _attempt_key)
    ON CONFLICT (order_id) WHERE provider = 'mercadopago' DO UPDATE SET
      provider_payment_id = NULL, status = 'pending', idempotency_key = EXCLUDED.idempotency_key, raw_payload = NULL, updated_at = now();
  UPDATE public.orders SET status = 'awaiting_payment', payment_status = 'pending', inventory_released_at = NULL, payment_expires_at = NULL WHERE id = o.id;
  RETURN jsonb_build_object('attemptKey', _attempt_key, 'paymentId', NULL, 'status', 'pending');
END $$;
REVOKE ALL ON FUNCTION public.begin_card_payment(uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_card_payment(uuid,uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.record_card_payment(_order_id uuid, _attempt_key uuid, _payment_id text, _amount numeric, _payload jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id AND payment_method = 'card' FOR UPDATE;
  IF NOT FOUND OR abs(o.total - _amount) > 0.009 OR _payload->>'external_reference' IS DISTINCT FROM _order_id::text THEN RAISE EXCEPTION 'Cobrança divergente.'; END IF;
  UPDATE public.payments SET provider_payment_id = _payment_id, raw_payload = _payload, updated_at = now()
    WHERE order_id = _order_id AND provider = 'mercadopago' AND idempotency_key = _attempt_key
      AND (provider_payment_id IS NULL OR provider_payment_id = _payment_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Tentativa divergente.'; END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_card_payment(uuid,uuid,text,numeric,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_card_payment(uuid,uuid,text,numeric,jsonb) TO service_role;