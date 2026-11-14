DROP FUNCTION IF EXISTS public.apply_mercado_pago_payment(uuid, text, text, numeric, jsonb);

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_uidx
  ON public.payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.apply_mercado_pago_payment(
  _order_id uuid,
  _external_reference text,
  _provider_payment_id text,
  _provider_status text,
  _status_detail text,
  _amount numeric,
  _currency text,
  _method text,
  _raw_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _order public.orders%ROWTYPE;
  _existing_payment public.payments%ROWTYPE;
  _stripe_approved boolean := false;
  _mp_other_approved boolean := false;
  _mapped_status public.payment_status;
  _normalized_method text;
  _item record;
  _has_restock boolean := false;
  _is_partial_refund boolean := false;
BEGIN
  IF _order_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_order_id');
  END IF;
  IF _provider_payment_id IS NULL OR trim(_provider_payment_id) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_provider_payment_id');
  END IF;
  IF _currency IS NULL OR upper(trim(_currency)) <> 'BRL' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_currency');
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('order_payment_lock_' || _order_id::text));

  SELECT * INTO _order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;

  IF _external_reference IS NOT NULL AND trim(_external_reference) <> '' THEN
    IF trim(_external_reference) <> _order_id::text THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'external_reference_mismatch');
    END IF;
  END IF;

  _mapped_status := CASE lower(trim(_provider_status))
    WHEN 'approved' THEN 'approved'::public.payment_status
    WHEN 'in_process' THEN 'pending'::public.payment_status
    WHEN 'pending' THEN 'pending'::public.payment_status
    WHEN 'rejected' THEN 'rejected'::public.payment_status
    WHEN 'cancelled' THEN 'cancelled'::public.payment_status
    WHEN 'refunded' THEN 'refunded'::public.payment_status
    WHEN 'charged_back' THEN 'charged_back'::public.payment_status
    WHEN 'in_mediation' THEN 'in_mediation'::public.payment_status
    ELSE 'pending'::public.payment_status
  END;

  _normalized_method := CASE
    WHEN lower(coalesce(_method, '')) IN ('pix', 'bank_transfer') THEN 'pix'
    WHEN lower(coalesce(_method, '')) IN ('credit_card', 'debit_card', 'card', 'master', 'visa', 'elo', 'hipercard', 'amex') THEN 'card'
    ELSE coalesce(nullif(lower(trim(_method)), ''), 'pix')
  END;

  INSERT INTO public.payments (
    order_id, provider, provider_payment_id, method, status, amount, raw_payload
  ) VALUES (
    _order_id, 'mercadopago', _provider_payment_id, coalesce(_method, _normalized_method),
    _mapped_status, _amount, _raw_payload
  )
  ON CONFLICT (provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL
  DO UPDATE SET
    status = EXCLUDED.status,
    method = COALESCE(EXCLUDED.method, payments.method),
    raw_payload = EXCLUDED.raw_payload,
    updated_at = now();

  IF _mapped_status = 'approved' THEN
    IF abs(_order.total - _amount) > 0.009 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
    END IF;

    SELECT EXISTS(
      SELECT 1 FROM public.payments
      WHERE order_id = _order_id AND provider = 'stripe' AND status = 'approved'
    ) INTO _stripe_approved;

    IF _stripe_approved THEN
      INSERT INTO public.order_status_history (order_id, status, note)
      VALUES (_order_id, _order.status, 'ALERTA CONCILIAÇÃO: Pagamento MP aprovado com cobrança Stripe já confirmada (' || _provider_payment_id || ')');
      RETURN jsonb_build_object('ok', true, 'status', 'approved', 'conciliation_needed', true, 'reason', 'already_approved_by_stripe');
    END IF;

    SELECT EXISTS(
      SELECT 1 FROM public.payments
      WHERE order_id = _order_id AND provider = 'mercadopago' AND status = 'approved'
        AND provider_payment_id <> _provider_payment_id
    ) INTO _mp_other_approved;

    IF _mp_other_approved THEN
      INSERT INTO public.order_status_history (order_id, status, note)
      VALUES (_order_id, _order.status, 'ALERTA CONCILIAÇÃO: Segundo pagamento Mercado Pago aprovado para o mesmo pedido (' || _provider_payment_id || ')');
      RETURN jsonb_build_object('ok', true, 'status', 'approved', 'conciliation_needed', true, 'reason', 'multiple_mercadopago_payments');
    END IF;

    IF _order.inventory_released_at IS NOT NULL THEN
      UPDATE public.orders SET payment_status = 'approved', updated_at = now() WHERE id = _order_id;
      INSERT INTO public.order_status_history (order_id, status, note)
      VALUES (_order_id, _order.status, 'ALERTA CONCILIAÇÃO: Pagamento MP aprovado após estoque ter sido liberado (' || _provider_payment_id || ')');
      RETURN jsonb_build_object('ok', true, 'status', 'approved', 'conciliation_needed', true, 'reason', 'released_before_payment');
    END IF;

    IF _order.payment_status = 'approved' THEN
      RETURN jsonb_build_object('ok', true, 'status', 'approved', 'conciliation_needed', false);
    END IF;

    UPDATE public.orders
    SET payment_status = 'approved', status = 'paid', payment_method = _normalized_method, updated_at = now()
    WHERE id = _order_id;

    FOR _item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = _order_id AND variant_id IS NOT NULL LOOP
      INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity, note)
      VALUES (_item.variant_id, _order_id, 'commit', _item.quantity, 'Pagamento confirmado pelo Mercado Pago');
    END LOOP;

    INSERT INTO public.order_status_history (order_id, status, note)
    VALUES (_order_id, 'paid', 'Pagamento confirmado pelo Mercado Pago (' || _normalized_method || ')');

    RETURN jsonb_build_object('ok', true, 'status', 'approved', 'conciliation_needed', false);

  ELSIF _mapped_status IN ('cancelled', 'rejected') THEN
    IF _order.payment_status = 'pending' AND _order.status = 'awaiting_payment' THEN
      PERFORM public.release_order_reservation(_order_id);
      INSERT INTO public.order_status_history (order_id, status, note)
      VALUES (_order_id, 'cancelled', 'Pedido cancelado/recusado no Mercado Pago (' || _provider_status || ')');
      RETURN jsonb_build_object('ok', true, 'status', _mapped_status, 'inventory_released', true);
    ELSE
      RETURN jsonb_build_object('ok', true, 'status', _mapped_status, 'inventory_already_released', true);
    END IF;

  ELSIF _mapped_status = 'in_mediation' THEN
    INSERT INTO public.order_status_history (order_id, status, note)
    VALUES (_order_id, _order.status, 'ALERTA AUDITORIA: Pagamento em disputa/mediação no Mercado Pago (' || coalesce(_status_detail, 'sem detalhe') || ')');
    RETURN jsonb_build_object('ok', true, 'status', 'in_mediation', 'mediation_alert', true);

  ELSIF _mapped_status = 'refunded' THEN
    _is_partial_refund := (_amount < _order.total) OR (_status_detail ILIKE '%partially%');

    IF _is_partial_refund THEN
      INSERT INTO public.order_status_history (order_id, status, note)
      VALUES (_order_id, _order.status, 'ALERTA AUDITORIA: Reembolso parcial recebido do Mercado Pago (R$ ' || _amount::text || ')');
      RETURN jsonb_build_object('ok', true, 'status', 'refunded', 'partial', true);
    ELSE
      UPDATE public.orders
      SET payment_status = 'refunded',
          status = CASE WHEN status = 'paid' THEN 'cancelled'::public.order_status ELSE status END,
          updated_at = now()
      WHERE id = _order_id;

      IF _order.status IN ('shipped', 'delivered') THEN
        INSERT INTO public.order_status_history (order_id, status, note)
        VALUES (_order_id, _order.status, 'ALERTA AUDITORIA: Reembolso processado para pedido já despachado/entregue (aguardando logística reversa)');
        RETURN jsonb_build_object('ok', true, 'status', 'refunded', 'restocked', false, 'reason', 'order_already_dispatched');
      END IF;

      SELECT EXISTS(
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = _order_id AND type = 'restock' AND note ILIKE '%Reembolso Mercado Pago%'
      ) INTO _has_restock;

      IF NOT _has_restock AND _order.inventory_released_at IS NULL THEN
        FOR _item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = _order_id AND variant_id IS NOT NULL LOOP
          UPDATE public.product_variants SET stock = stock + _item.quantity WHERE id = _item.variant_id;
          INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity, note)
          VALUES (_item.variant_id, _order_id, 'restock', _item.quantity, 'Reembolso Mercado Pago');
        END LOOP;

        IF _order.coupon_code IS NOT NULL THEN
          UPDATE public.coupons SET used_count = greatest(0, used_count - 1)
          WHERE upper(code) = upper(_order.coupon_code);
        END IF;

        INSERT INTO public.order_status_history (order_id, status, note)
        VALUES (_order_id, 'cancelled', 'Pedido reembolsado via Mercado Pago');
        RETURN jsonb_build_object('ok', true, 'status', 'refunded', 'restocked', true);
      ELSE
        RETURN jsonb_build_object('ok', true, 'status', 'refunded', 'restocked', false, 'already_refunded', true);
      END IF;
    END IF;

  ELSIF _mapped_status = 'charged_back' THEN
    UPDATE public.orders SET payment_status = 'charged_back', updated_at = now() WHERE id = _order_id;
    INSERT INTO public.order_status_history (order_id, status, note)
    VALUES (_order_id, _order.status, 'ALERTA AUDITORIA: Chargeback contestado no Mercado Pago');
    RETURN jsonb_build_object('ok', true, 'status', 'charged_back', 'chargeback_alert', true);

  ELSE
    RETURN jsonb_build_object('ok', true, 'status', _mapped_status);
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.apply_mercado_pago_payment(uuid, text, text, text, text, numeric, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_mercado_pago_payment(uuid, text, text, text, text, numeric, text, text, jsonb) TO service_role;