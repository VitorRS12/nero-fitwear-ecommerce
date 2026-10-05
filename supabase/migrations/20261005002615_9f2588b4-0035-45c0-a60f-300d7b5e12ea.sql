CREATE OR REPLACE FUNCTION public.create_pending_order(_user_id uuid, _customer_name text, _customer_email text, _customer_phone text, _shipping_address jsonb, _shipping_method text, _payment_method text, _coupon_code text, _items jsonb, _checkout_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_order public.orders%ROWTYPE; item jsonb; variant_row record; item_quantity integer; item_price numeric(10,2);
  computed_subtotal numeric(10,2) := 0; computed_discount numeric(10,2) := 0; computed_shipping numeric(10,2) := 0; computed_total numeric(10,2) := 0;
  eta_days integer; normalized_state text := upper(coalesce(_shipping_address->>'state', '')); coupon_row public.coupons%ROWTYPE; valid_coupon boolean := false;
BEGIN
  SELECT * INTO new_order FROM public.orders WHERE checkout_key = _checkout_key AND user_id = _user_id;
  IF FOUND THEN RETURN jsonb_build_object('id', new_order.id, 'orderNumber', new_order.order_number, 'subtotal', new_order.subtotal, 'discount', new_order.discount, 'shipping', new_order.shipping_cost, 'total', new_order.total, 'paymentStatus', new_order.payment_status, 'paymentExpiresAt', new_order.payment_expires_at); END IF;
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado.'; END IF;
  IF nullif(trim(_customer_name), '') IS NULL OR nullif(trim(_customer_email), '') IS NULL THEN RAISE EXCEPTION 'Informe nome e e-mail.'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'A sacola está vazia.'; END IF;
  IF _shipping_method NOT IN ('standard', 'express') THEN RAISE EXCEPTION 'Forma de entrega inválida.'; END IF;
  IF _payment_method <> 'pix' THEN RAISE EXCEPTION 'Forma de pagamento inválida.'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(_items) LOOP
    item_quantity := (item->>'quantity')::integer;
    IF item_quantity < 1 THEN RAISE EXCEPTION 'Quantidade inválida.'; END IF;
    SELECT v.id, v.sku, v.color, v.size, v.price, v.stock, v.is_active, p.name, p.slug, p.base_price, p.sale_price, p.is_active AS product_active,
      COALESCE(v.image_url, (SELECT pi.url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.position ASC LIMIT 1)) AS image_url
    INTO variant_row FROM public.product_variants v JOIN public.products p ON p.id = v.product_id WHERE v.id = (item->>'variantId')::uuid FOR UPDATE OF v;
    IF NOT FOUND OR NOT variant_row.is_active OR NOT variant_row.product_active THEN RAISE EXCEPTION 'Uma peça da sacola não está mais disponível.'; END IF;
    IF variant_row.stock < item_quantity THEN RAISE EXCEPTION 'Estoque insuficiente para %.', variant_row.name; END IF;
    item_price := COALESCE(variant_row.price, variant_row.sale_price, variant_row.base_price);
    computed_subtotal := computed_subtotal + item_price * item_quantity;
  END LOOP;
  IF nullif(trim(coalesce(_coupon_code, '')), '') IS NOT NULL THEN
    SELECT * INTO coupon_row FROM public.coupons WHERE upper(code) = upper(trim(_coupon_code)) AND is_active AND (expires_at IS NULL OR expires_at > now()) AND (max_uses IS NULL OR used_count < max_uses) AND computed_subtotal >= min_order_total FOR UPDATE;
    IF FOUND THEN valid_coupon := true; computed_discount := CASE WHEN coupon_row.discount_type = 'percent' THEN computed_subtotal * coupon_row.discount_value / 100 ELSE least(coupon_row.discount_value, computed_subtotal) END; END IF;
  END IF;
  IF _shipping_method = 'standard' AND computed_subtotal >= 399 THEN computed_shipping := 0;
  ELSIF normalized_state = ANY (ARRAY['AC','AP','AM','PA','RO','RR','TO']) THEN computed_shipping := CASE WHEN _shipping_method = 'express' THEN 69.90 ELSE 39.90 END;
  ELSIF normalized_state = ANY (ARRAY['AL','BA','CE','MA','PB','PE','PI','RN','SE']) THEN computed_shipping := CASE WHEN _shipping_method = 'express' THEN 54.90 ELSE 29.90 END;
  ELSIF normalized_state = ANY (ARRAY['DF','GO','MT','MS']) THEN computed_shipping := CASE WHEN _shipping_method = 'express' THEN 49.90 ELSE 27.90 END;
  ELSIF normalized_state = ANY (ARRAY['PR','RS','SC']) THEN computed_shipping := CASE WHEN _shipping_method = 'express' THEN 44.90 ELSE 24.90 END;
  ELSE computed_shipping := CASE WHEN _shipping_method = 'express' THEN 34.90 ELSE 19.90 END; END IF;
  eta_days := CASE WHEN _shipping_method = 'express' AND normalized_state = ANY (ARRAY['AC','AP','AM','PA','RO','RR','TO']) THEN 6 WHEN _shipping_method = 'express' AND normalized_state = ANY (ARRAY['AL','BA','CE','MA','PB','PE','PI','RN','SE','DF','GO','MT','MS']) THEN 4 WHEN _shipping_method = 'express' AND normalized_state = ANY (ARRAY['PR','RS','SC']) THEN 3 WHEN _shipping_method = 'express' THEN 2 WHEN normalized_state = ANY (ARRAY['AC','AP','AM','PA','RO','RR','TO']) THEN 12 WHEN normalized_state = ANY (ARRAY['AL','BA','CE','MA','PB','PE','PI','RN','SE']) THEN 9 WHEN normalized_state = ANY (ARRAY['DF','GO','MT','MS']) THEN 8 WHEN normalized_state = ANY (ARRAY['PR','RS','SC']) THEN 7 ELSE 5 END;
  computed_discount := least(computed_discount, computed_subtotal); computed_total := computed_subtotal - computed_discount + computed_shipping;
  INSERT INTO public.addresses (user_id, recipient, zip_code, state, city, neighborhood, street, number, complement, is_default) VALUES (_user_id, trim(_customer_name), _shipping_address->>'zipCode', normalized_state, _shipping_address->>'city', _shipping_address->>'neighborhood', _shipping_address->>'street', _shipping_address->>'number', nullif(_shipping_address->>'complement', ''), false);
  INSERT INTO public.orders (user_id, customer_name, customer_email, customer_phone, shipping_address, shipping_method, shipping_cost, shipping_eta_days, subtotal, discount, coupon_code, total, payment_method, status, payment_status, checkout_key, payment_expires_at)
  VALUES (_user_id, trim(_customer_name), lower(trim(_customer_email)), nullif(trim(coalesce(_customer_phone, '')), ''), _shipping_address, _shipping_method, computed_shipping, eta_days, computed_subtotal, computed_discount, CASE WHEN valid_coupon THEN coupon_row.code ELSE NULL END, computed_total, 'pix', 'awaiting_payment', 'pending', _checkout_key, now() + interval '30 minutes') RETURNING * INTO new_order;
  FOR item IN SELECT value FROM jsonb_array_elements(_items) LOOP
    item_quantity := (item->>'quantity')::integer;
    SELECT v.id, v.sku, v.color, v.size, v.price, p.name, p.slug, p.base_price, p.sale_price, COALESCE(v.image_url, (SELECT pi.url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.position ASC LIMIT 1)) AS image_url INTO variant_row FROM public.product_variants v JOIN public.products p ON p.id = v.product_id WHERE v.id = (item->>'variantId')::uuid FOR UPDATE OF v;
    item_price := COALESCE(variant_row.price, variant_row.sale_price, variant_row.base_price);
    UPDATE public.product_variants SET stock = stock - item_quantity WHERE id = variant_row.id AND stock >= item_quantity;
    IF NOT FOUND THEN RAISE EXCEPTION 'O estoque mudou durante o pedido. Tente novamente.'; END IF;
    INSERT INTO public.order_items (order_id, variant_id, product_name, product_slug, sku, color, size, image_url, unit_price, quantity, total) VALUES (new_order.id, variant_row.id, variant_row.name, variant_row.slug, variant_row.sku, variant_row.color, variant_row.size, variant_row.image_url, item_price, item_quantity, item_price * item_quantity);
    INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity, note) VALUES (variant_row.id, new_order.id, 'reserve', item_quantity, 'Reserva aguardando PIX');
  END LOOP;
  IF valid_coupon THEN UPDATE public.coupons SET used_count = used_count + 1 WHERE id = coupon_row.id; END IF;
  RETURN jsonb_build_object('id', new_order.id, 'orderNumber', new_order.order_number, 'subtotal', computed_subtotal, 'discount', computed_discount, 'shipping', computed_shipping, 'total', computed_total, 'paymentStatus', new_order.payment_status, 'paymentExpiresAt', new_order.payment_expires_at);
END; $$;
REVOKE ALL ON FUNCTION public.create_pending_order(uuid, text, text, text, jsonb, text, text, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_order(uuid, text, text, text, jsonb, text, text, text, jsonb, uuid) TO service_role;