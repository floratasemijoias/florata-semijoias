import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import logo from "@/assets/florata-logo-2.png.asset.json";
import { useSacola } from "@/lib/carrinho";

export function Header({ onAbrirSacola }: { onAbrirSacola: () => void }) {
  const { totalItens } = useSacola();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold/50">
            <img src={logo.url} alt="Logo Florata" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-2xl leading-none font-semibold text-primary">
              Florata
            </span>
            <span className="block text-[10px] tracking-brand text-muted-foreground uppercase">
              semijoias &amp; prata 925
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onAbrirSacola}
          aria-label="Ver sacola"
          className="relative grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-border text-primary transition-colors hover:bg-accent"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalItens > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-gradient px-1 text-[11px] font-semibold text-gold-foreground">
              {totalItens}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
