import { Slider } from "@/components/ui/slider";
import { formatarPreco } from "@/lib/florata";

export function Filtros({
  categorias,
  categoriaAtiva,
  onCategoria,
  tamanhos,
  tamanhosAtivos,
  onToggleTamanho,
  limitePreco,
  faixaPreco,
  onFaixaPreco,
}: {
  categorias: string[];
  categoriaAtiva: string;
  onCategoria: (c: string) => void;
  tamanhos: string[];
  tamanhosAtivos: string[];
  onToggleTamanho: (t: string) => void;
  limitePreco: [number, number];
  faixaPreco: [number, number];
  onFaixaPreco: (v: [number, number]) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {["Todas", ...categorias].map((cat) => {
          const ativa = categoriaAtiva === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoria(cat)}
              className={`shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
                ativa
                  ? "border-transparent bg-gold-gradient font-medium text-gold-foreground"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[10px] tracking-brand text-muted-foreground uppercase">Tamanho</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tamanhos.length === 0 && (
              <span className="text-sm text-muted-foreground">Sem tamanhos cadastrados</span>
            )}
            {tamanhos.map((t) => {
              const ativo = tamanhosAtivos.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleTamanho(t)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                    ativo
                      ? "border-gold bg-accent/70 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent/40"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] tracking-brand text-muted-foreground uppercase">
            Faixa de preço
          </p>
          <p className="mt-1 text-sm text-primary">
            {formatarPreco(faixaPreco[0])} — {formatarPreco(faixaPreco[1])}
          </p>
          <Slider
            className="mt-4"
            min={limitePreco[0]}
            max={limitePreco[1]}
            step={5}
            value={faixaPreco}
            onValueChange={(v) => onFaixaPreco([v[0] ?? 0, v[1] ?? 0])}
          />
        </div>
      </div>
    </div>
  );
}
