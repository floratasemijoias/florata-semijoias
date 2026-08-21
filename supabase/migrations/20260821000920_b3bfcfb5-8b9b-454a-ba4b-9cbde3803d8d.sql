CREATE TABLE public.produtos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  categoria text NOT NULL,
  tamanho text,
  preco numeric(10,2) NOT NULL DEFAULT 0,
  disponivel boolean NOT NULL DEFAULT true,
  quantidade integer,
  descricao text,
  imagem_url text,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.produtos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogo publico" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Admin insere" ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin atualiza" ON public.produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin remove" ON public.produtos FOR DELETE TO authenticated USING (true);

CREATE INDEX produtos_categoria_idx ON public.produtos (categoria);