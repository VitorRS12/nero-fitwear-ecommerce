
alter table "public"."categories" add column "focal_x" double precision not null default 50;

alter table "public"."categories" add column "focal_y" double precision not null default 50;

alter table "public"."home_media" add column "focal_x" double precision not null default 50;

alter table "public"."home_media" add column "focal_y" double precision not null default 50;

alter table "public"."product_images" add column "focal_x" double precision not null default 50;

alter table "public"."product_images" add column "focal_y" double precision not null default 50;

alter table "public"."categories" add constraint "categories_focal_x_range" CHECK (((focal_x >= (0)::double precision) AND (focal_x <= (100)::double precision))) not valid;

alter table "public"."categories" validate constraint "categories_focal_x_range";

alter table "public"."categories" add constraint "categories_focal_y_range" CHECK (((focal_y >= (0)::double precision) AND (focal_y <= (100)::double precision))) not valid;

alter table "public"."categories" validate constraint "categories_focal_y_range";

alter table "public"."home_media" add constraint "home_media_focal_x_range" CHECK (((focal_x >= (0)::double precision) AND (focal_x <= (100)::double precision))) not valid;

alter table "public"."home_media" validate constraint "home_media_focal_x_range";

alter table "public"."home_media" add constraint "home_media_focal_y_range" CHECK (((focal_y >= (0)::double precision) AND (focal_y <= (100)::double precision))) not valid;

alter table "public"."home_media" validate constraint "home_media_focal_y_range";

alter table "public"."product_images" add constraint "product_images_focal_x_range" CHECK (((focal_x >= (0)::double precision) AND (focal_x <= (100)::double precision))) not valid;

alter table "public"."product_images" validate constraint "product_images_focal_x_range";

alter table "public"."product_images" add constraint "product_images_focal_y_range" CHECK (((focal_y >= (0)::double precision) AND (focal_y <= (100)::double precision))) not valid;

alter table "public"."product_images" validate constraint "product_images_focal_y_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_pending_order(_user_id uuid, _customer_name text, _customer_email text, _customer_phone text, _shipping_address jsonb, _shipping_method text, _payment_method text, _coupon_code text, _items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_order public.orders%ROWTYPE;
  item jsonb;
  variant_row record;
  item_quantity integer;
  item_price numeric(10,2);
  computed_subtotal numeric(10,2) := 0;
  computed_discount numeric(10,2) := 0;
  computed_shipping numeric(10,2) := 0;
  computed_total numeric(10,2) := 0;
  eta_days integer;
  normalized_state text := upper(coalesce(_shipping_address->>'state', ''));
  coupon_row public.coupons%ROWTYPE;
  valid_coupon boolean := false;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado.'; END IF;
  IF nullif(trim(_customer_name), '') IS NULL OR nullif(trim(_customer_email), '') IS NULL THEN
    RAISE EXCEPTION 'Informe nome e e-mail.';
  END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'A sacola está vazia.';
  END IF;
  IF _shipping_method NOT IN ('standard', 'express') THEN RAISE EXCEPTION 'Forma de entrega inválida.'; END IF;
  IF _payment_method NOT IN ('pix', 'card') THEN RAISE EXCEPTION 'Forma de pagamento inválida.'; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(_items)
  LOOP
    item_quantity := (item->>'quantity')::integer;
    IF item_quantity < 1 THEN RAISE EXCEPTION 'Quantidade inválida.'; END IF;
    SELECT v.id, v.sku, v.color, v.size, v.price, v.stock, v.is_active,
           p.name, p.slug, p.base_price, p.sale_price, p.is_active AS product_active,
           COALESCE(v.image_url, (SELECT pi.url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.position ASC LIMIT 1)) AS image_url
      INTO variant_row
      FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
     WHERE v.id = (item->>'variantId')::uuid FOR UPDATE OF v;
    IF NOT FOUND OR NOT variant_row.is_active OR NOT variant_row.product_active THEN RAISE EXCEPTION 'Uma peça da sacola não está mais disponível.'; END IF;
    IF variant_row.stock < item_quantity THEN RAISE EXCEPTION 'Estoque insuficiente para %.', variant_row.name; END IF;
    item_price := COALESCE(variant_row.price, variant_row.sale_price, variant_row.base_price);
    computed_subtotal := computed_subtotal + (item_price * item_quantity);
  END LOOP;

  IF nullif(trim(coalesce(_coupon_code, '')), '') IS NOT NULL THEN
    SELECT * INTO coupon_row FROM public.coupons
     WHERE upper(code) = upper(trim(_coupon_code)) AND is_active
       AND (expires_at IS NULL OR expires_at > now())
       AND (max_uses IS NULL OR used_count < max_uses)
       AND computed_subtotal >= min_order_total FOR UPDATE;
    IF FOUND THEN
      valid_coupon := true;
      computed_discount := CASE WHEN coupon_row.discount_type = 'percent'
        THEN computed_subtotal * coupon_row.discount_value / 100
        ELSE LEAST(coupon_row.discount_value, computed_subtotal) END;
    END IF;
  END IF;

  IF _shipping_method = 'standard' AND computed_subtotal >= 399 THEN
    computed_shipping := 0;
  ELSIF normalized_state = ANY (ARRAY['AC','AP','AM','PA','RO','RR','TO']) THEN
    computed_shipping := CASE WHEN _shipping_method = 'express' THEN 69.90 ELSE 39.90 END;
  ELSIF normalized_state = ANY (ARRAY['AL','BA','CE','MA','PB','PE','PI','RN','SE']) THEN
    computed_shipping := CASE WHEN _shipping_method = 'express' THEN 54.90 ELSE 29.90 END;
  ELSIF normalized_state = ANY (ARRAY['DF','GO','MT','MS']) THEN
    computed_shipping := CASE WHEN _shipping_method = 'express' THEN 49.90 ELSE 27.90 END;
  ELSIF normalized_state = ANY (ARRAY['PR','RS','SC']) THEN
    computed_shipping := CASE WHEN _shipping_method = 'express' THEN 44.90 ELSE 24.90 END;
  ELSE computed_shipping := CASE WHEN _shipping_method = 'express' THEN 34.90 ELSE 19.90 END;
  END IF;
  eta_days := CASE
    WHEN _shipping_method = 'express' AND normalized_state = ANY (ARRAY['AC','AP','AM','PA','RO','RR','TO']) THEN 6
    WHEN _shipping_method = 'express' AND normalized_state = ANY (ARRAY['AL','BA','CE','MA','PB','PE','PI','RN','SE','DF','GO','MT','MS']) THEN 4
    WHEN _shipping_method = 'express' AND normalized_state = ANY (ARRAY['PR','RS','SC']) THEN 3
    WHEN _shipping_method = 'express' THEN 2
    WHEN normalized_state = ANY (ARRAY['AC','AP','AM','PA','RO','RR','TO']) THEN 12
    WHEN normalized_state = ANY (ARRAY['AL','BA','CE','MA','PB','PE','PI','RN','SE']) THEN 9
    WHEN normalized_state = ANY (ARRAY['DF','GO','MT','MS']) THEN 8
    WHEN normalized_state = ANY (ARRAY['PR','RS','SC']) THEN 7
    ELSE 5 END;

  computed_discount := LEAST(computed_discount, computed_subtotal);
  computed_total := computed_subtotal - computed_discount + computed_shipping;

  INSERT INTO public.addresses (user_id, recipient, zip_code, state, city, neighborhood, street, number, complement, is_default)
  VALUES (_user_id, trim(_customer_name), _shipping_address->>'zipCode', normalized_state, _shipping_address->>'city', _shipping_address->>'neighborhood', _shipping_address->>'street', _shipping_address->>'number', nullif(_shipping_address->>'complement', ''), false);

  INSERT INTO public.orders (user_id, customer_name, customer_email, customer_phone, shipping_address, shipping_method, shipping_cost, shipping_eta_days, subtotal, discount, coupon_code, total, payment_method, status, payment_status)
  VALUES (_user_id, trim(_customer_name), lower(trim(_customer_email)), nullif(trim(coalesce(_customer_phone, '')), ''), _shipping_address, _shipping_method, computed_shipping, eta_days, computed_subtotal, computed_discount, CASE WHEN valid_coupon THEN coupon_row.code ELSE NULL END, computed_total, _payment_method, 'awaiting_payment', 'pending')
  RETURNING * INTO new_order;

  FOR item IN SELECT value FROM jsonb_array_elements(_items)
  LOOP
    item_quantity := (item->>'quantity')::integer;
    SELECT v.id, v.sku, v.color, v.size, v.price, p.name, p.slug, p.base_price, p.sale_price,
           COALESCE(v.image_url, (SELECT pi.url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.position ASC LIMIT 1)) AS image_url
      INTO variant_row FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
     WHERE v.id = (item->>'variantId')::uuid FOR UPDATE OF v;
    item_price := COALESCE(variant_row.price, variant_row.sale_price, variant_row.base_price);
    UPDATE public.product_variants SET stock = stock - item_quantity WHERE id = variant_row.id;
    INSERT INTO public.order_items (order_id, variant_id, product_name, product_slug, sku, color, size, image_url, unit_price, quantity, total)
    VALUES (new_order.id, variant_row.id, variant_row.name, variant_row.slug, variant_row.sku, variant_row.color, variant_row.size, variant_row.image_url, item_price, item_quantity, item_price * item_quantity);
    INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity) VALUES (variant_row.id, new_order.id, 'commit', item_quantity);
  END LOOP;

  IF valid_coupon THEN UPDATE public.coupons SET used_count = used_count + 1 WHERE id = coupon_row.id; END IF;
  RETURN jsonb_build_object('id', new_order.id, 'orderNumber', new_order.order_number, 'subtotal', computed_subtotal, 'discount', computed_discount, 'shipping', computed_shipping, 'total', computed_total, 'paymentStatus', new_order.payment_status);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.commit_variant_stock(_variant_id uuid, _quantity integer, _order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE updated INT;
BEGIN
  UPDATE public.product_variants
     SET stock = stock - _quantity
   WHERE id = _variant_id AND stock >= _quantity;
  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN RETURN false; END IF;
  INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity)
  VALUES (_variant_id, _order_id, 'commit', _quantity);
  RETURN true;
END; $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles AS ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND _user_id = (SELECT auth.uid())
  );
$function$
;

CREATE OR REPLACE FUNCTION public.restock_variant(_variant_id uuid, _quantity integer, _order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.product_variants SET stock = stock + _quantity WHERE id = _variant_id;
  INSERT INTO public.inventory_movements (variant_id, order_id, type, quantity)
  VALUES (_variant_id, _order_id, 'restock', _quantity);
END; $function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;


