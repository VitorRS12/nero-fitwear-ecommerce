ALTER TABLE public.product_variants
  ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 3;

CREATE OR REPLACE FUNCTION public.admin_adjust_stock(
  _variant_id uuid, _mode text, _quantity integer, _note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v record; new_stock integer; delta integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _mode NOT IN ('add','set') OR _quantity IS NULL OR _quantity < 0 THEN RAISE EXCEPTION 'invalid_input'; END IF;
  IF _mode = 'add' AND _quantity = 0 THEN RAISE EXCEPTION 'invalid_input'; END IF;
  IF coalesce(length(trim(_note)),0) = 0 THEN RAISE EXCEPTION 'note_required'; END IF;
  SELECT id, stock, reserved INTO v FROM public.product_variants WHERE id = _variant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  new_stock := CASE WHEN _mode = 'add' THEN v.stock + _quantity ELSE _quantity END;
  IF new_stock < v.reserved THEN RAISE EXCEPTION 'below_reserved'; END IF;
  delta := new_stock - v.stock;
  IF delta = 0 THEN RETURN jsonb_build_object('ok', true, 'stock', new_stock); END IF;
  UPDATE public.product_variants SET stock = new_stock WHERE id = _variant_id;
  INSERT INTO public.inventory_movements (variant_id, type, quantity, note)
  VALUES (_variant_id, CASE WHEN _mode='add' THEN 'restock' ELSE 'adjust' END::inventory_movement_type, delta, left(trim(_note), 300));
  RETURN jsonb_build_object('ok', true, 'stock', new_stock);
END; $$;

REVOKE ALL ON FUNCTION public.admin_adjust_stock(uuid, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_stock(uuid, text, integer, text) TO authenticated, service_role;