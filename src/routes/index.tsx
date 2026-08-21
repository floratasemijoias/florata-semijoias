import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/florata/Header";
import { Filtros } from "@/components/florata/Filtros";
import { ProdutoCard } from "@/components/florata/ProdutoCard";
import { ProdutoDialog } from "@/components/florata/ProdutoDialog";
import { BarraSacola, SacolaSheet } from "@/components/florata/Sacola";
import { WhatsappFab } from "@/components/florata/WhatsappFab";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSacola } from "@/lib/carrinho";
import type { Produto } from "@/lib/florata";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Florata | Floricultura boutique — flores e arranjos" },
      {
        name: "description",
        content:
          "Catálogo online da Florata: buquês, arranjos e plantas selecionadas. Escolha, monte sua sacola e finalize o pedido pelo WhatsApp.",
      },
      { property: "og:title", content: "Florata | Floricultura boutique" },
      {
        property: "og:description",
        content:
          "Buquês, arranjos e plantas selecionadas. Monte sua sacola e finalize o pedido pelo WhatsApp.",
      },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
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
  const [selecionado, setSelecionado] = useState<Produto | null>(null);
  const [categoria, setCategoria] = useState("Todas");
  const [tamanhos, setTamanhos] = useState<string[]>([]);

  const lista = produtos ?? [];

  const categorias = useMemo(
    () => Array.from(new Set(lista.map((p) => p.categoria).filter(Boolean))).sort(),
    [lista],
  );

  const porCategoria = useMemo(
    () => (categoria === "Todas" ? lista : lista.filter((p) => p.categoria === categoria)),
    [lista, categoria],
  );

  const tamanhosDisponiveis = useMemo(
    () =>
      Array.from(new Set(porCategoria.map((p) => p.tamanho).filter((t): t is string => !!t))).sort(),
    [porCategoria],
  );

  const limitePreco = useMemo<[number, number]>(() => {
    if (porCategoria.length === 0) return [0, 500];
    const precos = porCategoria.map((p) => Number(p.preco));
    return [Math.floor(Math.min(...precos)), Math.max(Math.ceil(Math.max(...precos)), 1)];
  }, [porCategoria]);

  const [faixaPreco, setFaixaPreco] = useState<[number, number]>(limitePreco);

  useEffect(() => {
    setFaixaPreco(limitePreco);
    setTamanhos([]);
  }, [categoria, limitePreco[0], limitePreco[1]]);

  const filtrados = porCategoria.filter((p) => {
    const preco = Number(p.preco);
    const okPreco = preco >= faixaPreco[0] && preco <= faixaPreco[1];
    const okTamanho = tamanhos.length === 0 || (p.tamanho ? tamanhos.includes(p.tamanho) : false);
    return okPreco && okTamanho;
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header onAbrirSacola={() => setSacolaAberta(true)} />

      <section className="border-b border-border bg-accent/25">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:py-14">
          <p className="text-[10px] tracking-brand text-muted-foreground uppercase">
            Semijoias selecionadas
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold text-primary sm:text-5xl">
            Peças que <span className="text-gold-gradient">brilham</span> com você
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Escolha suas favoritas, monte a sacola e finalize o pedido pelo WhatsApp. Entrega
            combinada com todo cuidado.
          </p>

        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Filtros
          categorias={categorias}
          categoriaAtiva={categoria}
          onCategoria={setCategoria}
          tamanhos={tamanhosDisponiveis}
          tamanhosAtivos={tamanhos}
          onToggleTamanho={(t) =>
            setTamanhos((atual) =>
              atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t],
            )
          }
          limitePreco={limitePreco}
          faixaPreco={faixaPreco}
          onFaixaPreco={setFaixaPreco}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-4/5 w-full rounded-xl" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado com esses filtros.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {filtrados.map((p) => (
              <ProdutoCard key={p.id} produto={p} onSelecionar={setSelecionado} />
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

      <ProdutoDialog produto={selecionado} onFechar={() => setSelecionado(null)} />
      <BarraSacola onAbrir={() => setSacolaAberta(true)} />
      <SacolaSheet aberta={sacolaAberta} onOpenChange={setSacolaAberta} />
      <WhatsappFab deslocado={totalItens > 0} />
    </div>
  );
}
