DROP POLICY IF EXISTS "Admin insere" ON public.produtos;
DROP POLICY IF EXISTS "Admin atualiza" ON public.produtos;
DROP POLICY IF EXISTS "Admin remove" ON public.produtos;

CREATE POLICY "Admin insere"
ON public.produtos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admin atualiza"
ON public.produtos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admin remove"
ON public.produtos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

DROP POLICY IF EXISTS "Admin insere banner" ON public.banners;
DROP POLICY IF EXISTS "Admin atualiza banner" ON public.banners;
DROP POLICY IF EXISTS "Admin remove banner" ON public.banners;

CREATE POLICY "Admin insere banner"
ON public.banners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admin atualiza banner"
ON public.banners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admin remove banner"
ON public.banners
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

DROP POLICY IF EXISTS "Imagens produtos upload admin" ON storage.objects;
DROP POLICY IF EXISTS "Imagens produtos update admin" ON storage.objects;
DROP POLICY IF EXISTS "Imagens produtos delete admin" ON storage.objects;

CREATE POLICY "Imagens produtos upload admin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'produtos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Imagens produtos update admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'produtos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
)
WITH CHECK (
  bucket_id = 'produtos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Imagens produtos delete admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'produtos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
  )
);