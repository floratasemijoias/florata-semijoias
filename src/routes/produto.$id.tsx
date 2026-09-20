import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Flower2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/florata/Header";
import { BarraSacola, SacolaSheet } from "@/components/florata/Sacola";
import { WhatsappFab } from "@/components/florata/WhatsappFab";
import { supabase } from "@/integrations/supabase/client";
import { useSacola } from "@/lib/carrinho";
import { formatarPreco, listarTamanhos, type Produto } from "@/lib/florata";
import { trackAddToCart, trackViewItem } from "@/lib/gtm";

export const Route = createFileRoute("/produto/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    return { produto: (data as Produto | null) ?? null };
  },
  head: ({ loaderData }) => {
    const produto = loaderData?.produto;
    if (!produto) {
      return { meta: [{ title: "Produto não encontrado | Florata" }] };
    }
    const descricao =
      produto.descricao?.slice(0, 160) ||
      `${produto.nome} — ${produto.categoria}. Semijoias Florata, prata 925.`;
    return {
      meta: [
        { title: `${produto.nome} | Florata` },
        { name: "description", content: descricao },
        { property: "og:title", content: produto.nome },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "product" },
        ...(produto.imagem_url ? [{ property: "og:image", content: produto.imagem_url }] : []),
        { property: "product:price:amount", content: String(produto.preco) },
        { property: "product:price:currency", content: "BRL" },
        { property: "product:availability", content: produto.disponivel ? "in stock" : "out of stock" },
      ],
    };
  },
  component: ProdutoPagina,
});

function ProdutoPagina() {
  const { produto } = Route.useLoaderData();
  const { adicionar } = useSacola();
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [qtd, setQtd] = useState(1);
  const tamanhos = useMemo(() => listarTamanhos(produto?.tamanho), [produto?.tamanho]);
  const [tamanho, setTamanho] = useState<string | null>(
    tamanhos.length === 1 ? tamanhos[0]! : null,
  );

  useEffect(() => {
    if (!produto) return;
    trackViewItem({
      item_id: produto.id,
      item_name: produto.nome,
      price: Number(produto.preco),
      item_category: produto.categoria,
    });
  }, [produto]);

  if (!produto) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header onAbrirSacola={() => setSacolaAberta(true)} />
        <main className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-center">
          <p className="text-lg font-medium text-primary">Produto não encontrado</p>
          <p className="text-sm text-muted-foreground">
            Ele pode ter sido removido ou o link está incorreto.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Link>
        </main>
        <BarraSacola onAbrir={() => setSacolaAberta(true)} />
        <SacolaSheet aberta={sacolaAberta} onOpenChange={setSacolaAberta} />
        <WhatsappFab />
      </div>
    );
  }

  const esgotado = !produto.disponivel;

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header onAbrirSacola={() => setSacolaAberta(true)} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary md:mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
        </Link>

        <div className="md:grid md:grid-cols-2 md:items-start md:gap-10">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-accent/40 md:sticky md:top-6">
          {produto.imagem_url ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className={`h-full w-full object-cover ${esgotado ? "opacity-50 grayscale" : ""}`}
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted-foreground">
              <Flower2 className="h-10 w-10" />
            </span>
          )}
          {esgotado && (
            <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-widest text-primary-foreground uppercase">
              Esgotado
            </span>
          )}
        </div>

        <div className="space-y-4 pt-4 md:pt-0">
          <div className="space-y-1">
            <span className="text-[10px] tracking-brand text-muted-foreground uppercase">
              {produto.categoria}
            </span>
            <h1 className="font-times text-2xl font-semibold text-primary">{produto.nome}</h1>
          </div>

          <p className="text-xl font-medium text-primary">
            {formatarPreco(Number(produto.preco))}
          </p>

          {tamanhos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                Tamanho{tamanhos.length > 1 ? ": escolha uma opção" : `: ${tamanhos[0]}`}
              </p>
              {tamanhos.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {tamanhos.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTamanho(t)}
                      aria-pressed={tamanho === t}
                      className={`min-w-11 cursor-pointer rounded-full border px-3 py-2 text-sm transition-colors ${
                        tamanho === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-primary hover:bg-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {produto.descricao && (
            <p className="text-sm leading-relaxed text-muted-foreground">{produto.descricao}</p>
          )}

          {!esgotado ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQtd((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 cursor-pointer place-items-center text-primary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{qtd}</span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQtd((q) => q + 1)}
                  className="grid h-10 w-10 cursor-pointer place-items-center text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="gold"
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (tamanhos.length > 1 && !tamanho) {
                    toast.error("Escolha um tamanho");
                    return;
                  }
                  const tamEscolhido = tamanho ?? tamanhos[0] ?? null;
                  adicionar(produto, qtd, tamEscolhido);
                  trackAddToCart({
                    item_id: produto.id,
                    item_name: produto.nome,
                    price: Number(produto.preco),
                    quantity: qtd,
                    item_category: produto.categoria,
                    ...(tamEscolhido ? { item_variant: tamEscolhido } : {}),
                  });
                  toast.success("Adicionado à sacola");
                }}
              >
                Adicionar à sacola
              </Button>
            </div>
          ) : (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Este produto está esgotado. Fale com a gente pelo WhatsApp para saber sobre a
              próxima disponibilidade.
            </p>
          )}
        </div>
        </div>
      </main>

      <BarraSacola onAbrir={() => setSacolaAberta(true)} />
      <SacolaSheet aberta={sacolaAberta} onOpenChange={setSacolaAberta} />
      <WhatsappFab />
    </div>
  );
}
