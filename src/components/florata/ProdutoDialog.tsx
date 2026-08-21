import { useEffect, useState } from "react";
import { Flower2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSacola } from "@/lib/carrinho";
import { formatarPreco, type Produto } from "@/lib/florata";

export function ProdutoDialog({
  produto,
  onFechar,
}: {
  produto: Produto | null;
  onFechar: () => void;
}) {
  const { adicionar } = useSacola();
  const [qtd, setQtd] = useState(1);

  useEffect(() => {
    setQtd(1);
  }, [produto?.id]);

  const esgotado = produto ? !produto.disponivel : false;

  return (
    <Dialog open={!!produto} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {produto && (
          <>
            <div className="relative aspect-square w-full bg-accent/40">
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

            <div className="space-y-4 p-5">
              <DialogHeader className="space-y-1 text-left">
                <span className="text-[10px] tracking-brand text-muted-foreground uppercase">
                  {produto.categoria}
                  {produto.tamanho ? ` · ${produto.tamanho}` : ""}
                </span>
                <DialogTitle className="font-display text-2xl font-semibold text-primary">
                  {produto.nome}
                </DialogTitle>
              </DialogHeader>

              <p className="text-xl font-medium text-primary">
                {formatarPreco(Number(produto.preco))}
              </p>

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
                      adicionar(produto, qtd);
                      toast.success("Adicionado à sacola");
                      onFechar();
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
