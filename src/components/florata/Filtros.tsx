export function Filtros({
  categorias,
  categoriaAtiva,
  onCategoria,
}: {
  categorias: string[];
  categoriaAtiva: string;
  onCategoria: (c: string) => void;
}) {
  return (
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
  );
}
