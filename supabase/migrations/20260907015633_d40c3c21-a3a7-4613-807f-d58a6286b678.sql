ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS product_images_product_position_idx
  ON public.product_images (product_id, position);

CREATE POLICY "product_images_admin_read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "product_images_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "product_images_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "product_images_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));