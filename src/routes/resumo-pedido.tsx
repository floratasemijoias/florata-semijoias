import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flower2 } from "lucide-react";
import { Header } from "@/components/florata/Header";
import { supabase } from "@/integrations/supabase/client";
import { decodificarItensResumo } from "@/lib/resumo-pedido";
import { formatarPreco, type Produto } from "@/lib/florata";

export const Route = createFileRoute("/resumo-pedido")({
  validateSearch: (busca: Record<string, unknown>) => ({
    itens: typeof busca.itens === "string" ? busca.itens : "",
  }),
  head: () => ({
    meta: [
      { title: "Resumo do pedido | Florata" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResumoPedido,
});

function ResumoPedido() {
  const { itens: itensCodificados } = Route.useSearch();
  const pedido = decodificarItensResumo(itensCodificados);
  const slugs = pedido.map((i) => i.s);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["resumo-pedido", slugs.join(",")],
    queryFn: async () => {
      if (slugs.length === 0) return [];
      const { data, error } = await supabase.from("produtos").select("*").in("slug", slugs);
      if (error) throw error;
      return (data ?? []) as Produto[];
    },
    enabled: slugs.length > 0,
  });

  const linhas = pedido
    .map((item) => {
      const produto = produtos?.find((p) => p.slug === item.s);
      return produto ? { produto, quantidade: item.q, tamanho: item.t } : null;
    })
    .filter((l): l is { produto: Produto; quantidade: number; tamanho: string | null } => !!l);

  const total = linhas.reduce((soma, l) => soma + l.produto.preco * l.quantidade, 0);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header onAbrirSacola={() => {}} />

      <main className="mx-auto max-w-xl space-y-4 px-4 py-8">
        <div className="space-y-1">
          <h1 className="font-times text-2xl font-semibold text-primary">Resumo do pedido</h1>
          <p className="text-sm text-muted-foreground">
            {linhas.length > 0
              ? `${linhas.length} ${linhas.length === 1 ? "item" : "itens"}`
              : ""}
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os itens deste pedido — o link pode estar incompleto.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {linhas.map((l, idx) => (
                <li key={idx} className="flex items-center gap-3 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-accent/40">
                    {l.produto.imagem_url ? (
                      <img
                        src={l.produto.imagem_url}
                        alt={l.produto.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-muted-foreground">
                        <Flower2 className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-primary">{l.produto.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.tamanho ? `Tamanho ${l.tamanho} · ` : ""}
                      {l.quantidade}x {formatarPreco(l.produto.preco)}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium text-primary">
                    {formatarPreco(l.produto.preco * l.quantidade)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="font-medium text-primary">Total</span>
              <span className="text-lg font-semibold text-primary">{formatarPreco(total)}</span>
            </div>
          </>
        )}

        <Link
          to="/"
          className="inline-block text-sm text-muted-foreground hover:text-primary"
        >
          Ver catálogo completo
        </Link>
      </main>
    </div>
  );
}
