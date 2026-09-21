import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/florata/Header";
import { Filtros } from "@/components/florata/Filtros";
import { ProdutoCard } from "@/components/florata/ProdutoCard";
import { BarraSacola, SacolaSheet } from "@/components/florata/Sacola";
import { WhatsappFab } from "@/components/florata/WhatsappFab";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSacola } from "@/lib/carrinho";
import { CATEGORIA_DESTAQUE, type Produto } from "@/lib/florata";

const TODAS_SUBCATEGORIAS = "Todos";

export const Route = createFileRoute("/personalizados")({
  head: () => ({
    meta: [
      { title: `${CATEGORIA_DESTAQUE} | Florata` },
      {
        name: "description",
        content: "Semijoias personalizadas Florata, feitas sob medida pra você.",
      },
    ],
  }),
  component: Personalizados,
});

function Personalizados() {
  const { data: produtos, isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Produto[];
    },
  });

  const { totalItens } = useSacola();
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [subcategoria, setSubcategoria] = useState(TODAS_SUBCATEGORIAS);

  const lista = (produtos ?? []).filter(
    (p) => p.categoria.trim().toLowerCase() === CATEGORIA_DESTAQUE.toLowerCase(),
  );

  const subcategorias = Array.from(
    new Set(lista.map((p) => p.subcategoria).filter((s): s is string => !!s)),
  ).sort();

  const filtrados =
    subcategoria === TODAS_SUBCATEGORIAS
      ? lista
      : lista.filter((p) => p.subcategoria === subcategoria);

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header onAbrirSacola={() => setSacolaAberta(true)} />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Todos os produtos
        </Link>

        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-primary">
            {CATEGORIA_DESTAQUE}
          </h1>
          <p className="text-sm text-muted-foreground">Semijoias feitas sob medida pra você.</p>
        </div>

        {subcategorias.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-brand text-muted-foreground uppercase">
              Filtrar por tipo
            </p>
            <Filtros
              categorias={[TODAS_SUBCATEGORIAS, ...subcategorias]}
              categoriaAtiva={subcategoria}
              onCategoria={setSubcategoria}
              variante="secundario"
            />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-4/5 w-full rounded-xl" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {lista.length === 0
              ? "Nenhum produto personalizado cadastrado ainda."
              : "Nenhum produto encontrado nesta subcategoria."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {filtrados.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="font-display text-xl text-primary">Florata</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pedidos e dúvidas pelo WhatsApp (51) 99789-7864
        </p>
      </footer>

      <BarraSacola onAbrir={() => setSacolaAberta(true)} />
      <SacolaSheet aberta={sacolaAberta} onOpenChange={setSacolaAberta} />
      <WhatsappFab deslocado={totalItens > 0} />
    </div>
  );
}
