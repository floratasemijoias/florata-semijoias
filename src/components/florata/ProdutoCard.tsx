import { Flower2 } from "lucide-react";
import { formatarPreco, type Produto } from "@/lib/florata";

export function ProdutoCard({
  produto,
  onSelecionar,
}: {
  produto: Produto;
  onSelecionar: (p: Produto) => void;
}) {
  const esgotado = !produto.disponivel;

  return (
    <button
      type="button"
      onClick={() => onSelecionar(produto)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-soft"
    >
      <div className="relative aspect-4/5 w-full overflow-hidden bg-accent/40">
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              esgotado ? "opacity-45 grayscale" : ""
            }`}
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted-foreground">
            <Flower2 className="h-8 w-8" />
          </span>
        )}
        {esgotado && (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-widest text-primary-foreground uppercase">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-[10px] tracking-brand text-muted-foreground uppercase">
          {produto.categoria}
        </span>
        <h3 className="line-clamp-2 font-display text-lg leading-tight font-semibold text-primary">
          {produto.nome}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="text-base font-medium text-primary">
            {formatarPreco(Number(produto.preco))}
          </span>
          {produto.tamanho && (
            <span className="rounded-full border border-gold/50 bg-accent/50 px-2 py-0.5 text-[11px] text-primary">
              {produto.tamanho}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
