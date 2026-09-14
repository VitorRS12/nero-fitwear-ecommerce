CREATE TABLE public.home_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL UNIQUE CHECK (slot IN ('hero','banner')),
  url TEXT NOT NULL,
  alt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_media TO authenticated;
GRANT ALL ON public.home_media TO service_role;

ALTER TABLE public.home_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_media_public_read" ON public.home_media
  FOR SELECT USING (is_active = true);

CREATE POLICY "home_media_admin_all" ON public.home_media
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER home_media_updated_at BEFORE UPDATE ON public.home_media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();