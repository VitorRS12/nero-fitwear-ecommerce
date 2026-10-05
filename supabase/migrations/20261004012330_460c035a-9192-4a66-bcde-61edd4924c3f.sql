CREATE UNIQUE INDEX IF NOT EXISTS payments_one_mercadopago_per_order ON public.payments(order_id) WHERE provider = 'mercadopago';
CREATE OR REPLACE FUNCTION public.apply_mercado_pago_payment(_order_id uuid, _provider_payment_id text, _provider_status text, _amount numeric, _raw_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE order_row public.orders%ROWTYPE; payment_row public.payments%ROWTYPE; mapped_status public.payment_status; item_row record;
BEGIN
  SELECT * INTO order_row FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND OR order_row.payment_method <> 'pix' THEN RAISE EXCEPTION 'Pedido PIX não encontrado.'; END IF;
  SELECT * INTO payment_row FROM public.payments WHERE order_id = _order_id AND provider = 'mercadopago' FOR UPDATE;
  IF NOT FOUND OR payment_row.provider_payment_id IS DISTINCT FROM _provider_payment_id THEN RAISE EXCEPTION 'Cobrança não registrada neste pedido.'; END IF;
  IF abs(order_row.total - _amount) > 0.009 OR abs(payment_row.amount - _amount) > 0.009 THEN RAISE EXCEPTION 'Valor do pagamento divergente.'; END IF;
  mapped_status := CASE WHEN _provider_status = 'approved' THEN 'approved'::public.payment_status WHEN _provider_status = 'rejected' THEN 'rejected'::public.payment_status WHEN _provider_status IN ('cancelled', 'charged_back') THEN 'cancelled'::public.payment_status WHEN _provider_status = 'refunded' THEN 'refunded'::public.payment_status ELSE 'pending'::public.payment_status END;
  IF order_row.payment_status = 'approved' AND mapped_status NOT IN ('refunded', 'cancelled') THEN RETURN jsonb_build_object('orderId', _order_id, 'status', 'approved'); END IF;
  IF order_row.inventory_released_at IS NOT NULL THEN RETURN jsonb_build_object('orderId', _order_id, 'status', 'released'); END IF;
  UPDATE public.payments SET status = mapped_status, raw_payload = _raw_payload, updated_at = now() WHERE id = payment_row.id;
  IF mapped_status = 'approved' AND order_row.payment_status <> 'approved' THEN
    UPDATE public.orders SET payment_status = 'approved', status = 'paid' WHERE id = _order_id;
    FOR item_row IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = _order_id AND variant_id IS NOT NULL LOOP
      INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity, note) VALUES (item_row.variant_id, _order_id, 'commit', item_row.quantity, 'PIX aprovado pelo Mercado Pago');
    END LOOP;
  ELSIF mapped_status IN ('rejected', 'cancelled') AND order_row.payment_status = 'pending' THEN
    PERFORM public.release_order_reservation(_order_id);
  ELSIF mapped_status IN ('refunded', 'cancelled') AND order_row.payment_status = 'approved' THEN
    UPDATE public.orders SET payment_status = mapped_status WHERE id = _order_id;
  END IF;
  RETURN jsonb_build_object('orderId', _order_id, 'status', mapped_status);
END; $$;
REVOKE ALL ON FUNCTION public.apply_mercado_pago_payment(uuid, text, text, numeric, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_mercado_pago_payment(uuid, text, text, numeric, jsonb) TO service_role;