CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Admin remove" ON public.produtos;
DROP POLICY IF EXISTS "Admin atualiza" ON public.produtos;
DROP POLICY IF EXISTS "Admin insere" ON public.produtos;
CREATE POLICY "Admin remove" ON public.produtos FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin atualiza" ON public.produtos FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin insere" ON public.produtos FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admin remove banner" ON public.banners;
DROP POLICY IF EXISTS "Admin atualiza banner" ON public.banners;
DROP POLICY IF EXISTS "Admin insere banner" ON public.banners;
CREATE POLICY "Admin remove banner" ON public.banners FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin atualiza banner" ON public.banners FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin insere banner" ON public.banners FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Imagens produtos delete admin" ON storage.objects;
DROP POLICY IF EXISTS "Imagens produtos update admin" ON storage.objects;
DROP POLICY IF EXISTS "Imagens produtos insert admin" ON storage.objects;
DROP POLICY IF EXISTS "Imagens produtos upload admin" ON storage.objects;
CREATE POLICY "Imagens produtos delete admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'produtos' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Imagens produtos update admin" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'produtos' AND private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (bucket_id = 'produtos' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Imagens produtos upload admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produtos' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);