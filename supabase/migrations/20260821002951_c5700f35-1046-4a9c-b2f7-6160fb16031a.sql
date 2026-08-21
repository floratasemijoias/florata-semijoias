CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve seus papeis" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

INSERT INTO public.user_roles (user_id, role)
VALUES ('c4f7a7ad-2ef1-4682-aa26-b9397a9cc810', 'admin')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Admin insere" ON public.produtos;
DROP POLICY IF EXISTS "Admin atualiza" ON public.produtos;
DROP POLICY IF EXISTS "Admin remove" ON public.produtos;

CREATE POLICY "Admin insere" ON public.produtos
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin atualiza" ON public.produtos
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin remove" ON public.produtos
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Imagens produtos upload admin" ON storage.objects;
DROP POLICY IF EXISTS "Imagens produtos update admin" ON storage.objects;
DROP POLICY IF EXISTS "Imagens produtos delete admin" ON storage.objects;

CREATE POLICY "Imagens produtos upload admin" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Imagens produtos update admin" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Imagens produtos delete admin" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'produtos' AND public.has_role(auth.uid(), 'admin'));