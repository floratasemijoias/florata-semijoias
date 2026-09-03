CREATE TABLE public.settings (
  id boolean PRIMARY KEY DEFAULT true,
  gtm_container_id text,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id)
);

GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configuracoes publicas para leitura"
ON public.settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin insere configuracoes"
ON public.settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::public.app_role));

CREATE POLICY "Admin atualiza configuracoes"
ON public.settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::public.app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::public.app_role));

INSERT INTO public.settings (id, gtm_container_id) VALUES (true, NULL);