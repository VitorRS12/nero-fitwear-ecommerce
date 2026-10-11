CREATE OR REPLACE FUNCTION public.cancel_unsubmitted_card_order(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id AND user_id = _user_id AND payment_method = 'card' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado.'; END IF;
  IF EXISTS(SELECT 1 FROM public.payments WHERE order_id = o.id) THEN RAISE EXCEPTION 'Pagamento já iniciado.'; END IF;
  RETURN public.release_order_reservation(o.id);
END $$;
REVOKE ALL ON FUNCTION public.cancel_unsubmitted_card_order(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_unsubmitted_card_order(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.release_abandoned_card_orders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record; count_released integer := 0;
BEGIN
  FOR o IN SELECT id FROM public.orders WHERE payment_method='card' AND status='awaiting_payment' AND payment_expires_at <= now() AND inventory_released_at IS NULL FOR UPDATE SKIP LOCKED LOOP
    IF NOT EXISTS(SELECT 1 FROM public.payments WHERE order_id=o.id) AND public.release_order_reservation(o.id) THEN count_released := count_released + 1; END IF;
  END LOOP;
  RETURN count_released;
END $$;
REVOKE ALL ON FUNCTION public.release_abandoned_card_orders() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.release_abandoned_card_orders() TO service_role;

DO $$ DECLARE definition text; BEGIN
  SELECT pg_get_functiondef('public.apply_mercado_pago_payment(uuid,text,text,numeric,jsonb)'::regprocedure) INTO definition;
  definition := replace(definition, 'PERFORM public.release_order_reservation(_order_id);', 'PERFORM public.release_order_reservation(_order_id);' || chr(10) || '    IF order_row.payment_method = ''card'' THEN UPDATE public.orders SET payment_status = mapped_status WHERE id = _order_id; END IF;');
  EXECUTE definition;
END $$;