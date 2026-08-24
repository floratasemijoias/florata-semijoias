import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/florata/Header";
import { Banners } from "@/components/florata/Banners";
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
      { title: "Florata | Semijoias — catálogo online" },
      {
        name: "description",
        content:
          "Catálogo online de semijoias Florata: brincos, colares, anéis e pulseiras. Monte sua sacola e finalize o pedido pelo WhatsApp.",
      },
      { property: "og:title", content: "Florata | Semijoias" },
      {
        property: "og:description",
        content:
          "Semijoias selecionadas: brincos, colares, anéis e pulseiras. Pedido finalizado pelo WhatsApp.",
      },
    ],
  }),
  component: Catalogo,
});

function pseudoAleatorio(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function obterSemente() {
  if (typeof window === "undefined") return 1;
  const chave = "florata_ordem_semente";
  let s = window.sessionStorage.getItem(chave);
  if (!s) {
    s = String(Math.floor(Math.random() * 1_000_000) + 1);
    window.sessionStorage.setItem(chave, s);
  }
  return Number(s);
}

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
  const [semente, setSemente] = useState(1);

  useEffect(() => {
    setSemente(obterSemente());
  }, []);

  const lista = produtos ?? [];

  const categorias = useMemo(
    () => Array.from(new Set(lista.map((p) => p.categoria).filter(Boolean))).sort(),
    [lista],
  );

  const embaralhados = useMemo(() => {
    const arr = [...lista];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoAleatorio(semente + i) * (i + 1));
      const tmp = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = tmp;
    }
    return arr;
  }, [lista, semente]);

  const filtrados = useMemo(
    () =>
      categoria === "Todas"
        ? embaralhados
        : embaralhados.filter((p) => p.categoria === categoria),
    [embaralhados, categoria],
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header onAbrirSacola={() => setSacolaAberta(true)} />

      <Banners />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Filtros categorias={categorias} categoriaAtiva={categoria} onCategoria={setCategoria} />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-4/5 w-full rounded-xl" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado nesta categoria.
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
