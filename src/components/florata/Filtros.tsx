export function Filtros({
  categorias,
  categoriaAtiva,
  onCategoria,
  variante = "principal",
}: {
  categorias: string[];
  categoriaAtiva: string;
  onCategoria: (c: string) => void;
  /** "secundario": pilulas menores e discretas, pra filtros dentro de uma
   * página (ex.: subcategoria), sem competir visualmente com a navegação
   * principal de categorias. */
  variante?: "principal" | "secundario";
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {categorias.map((cat) => {
        const ativa = categoriaAtiva === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoria(cat)}
            className={
              variante === "secundario"
                ? `shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                    ativa
                      ? "border-primary/40 bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`
                : `shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    ativa
                      ? "border-transparent bg-gold-gradient font-medium text-gold-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`
            }
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
