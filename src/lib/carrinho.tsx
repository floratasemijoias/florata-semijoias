import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Produto } from "./florata";

export type ItemSacola = {
  id: string;
  produtoId?: string;
  slug?: string;
  categoria?: string | null;
  nome: string;
  tamanho: string | null;
  preco: number;
  imagem_url: string | null;
  quantidade: number;
};

type SacolaContexto = {
  itens: ItemSacola[];
  totalItens: number;
  totalValor: number;
  adicionar: (produto: Produto, quantidade: number, tamanho?: string | null) => void;
  definirQuantidade: (id: string, quantidade: number) => void;
  remover: (id: string) => void;
  limpar: () => void;
};

const Ctx = createContext<SacolaContexto | null>(null);
const CHAVE = "florata-sacola";

export function SacolaProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemSacola[]>([]);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) setItens(JSON.parse(salvo));
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* ignora */
    }
  }, [itens]);

  const valor = useMemo<SacolaContexto>(() => {
    return {
      itens,
      totalItens: itens.reduce((s, i) => s + i.quantidade, 0),
      totalValor: itens.reduce((s, i) => s + i.quantidade * i.preco, 0),
      adicionar: (produto, quantidade, tamanho) =>
        setItens((atual) => {
          const tam = tamanho ?? produto.tamanho ?? null;
          const chave = tam ? `${produto.id}::${tam}` : produto.id;
          const existente = atual.find((i) => i.id === chave);
          if (existente) {
            return atual.map((i) =>
              i.id === chave ? { ...i, quantidade: i.quantidade + quantidade } : i,
            );
          }
          return [
            ...atual,
            {
              id: chave,
              produtoId: produto.id,
              slug: produto.slug,
              categoria: produto.categoria,
              nome: produto.nome,
              tamanho: tam,
              preco: Number(produto.preco),
              imagem_url: produto.imagem_url,
              quantidade,
            },
          ];
        }),
      definirQuantidade: (id, quantidade) =>
        setItens((atual) =>
          quantidade <= 0
            ? atual.filter((i) => i.id !== id)
            : atual.map((i) => (i.id === id ? { ...i, quantidade } : i)),
        ),
      remover: (id) => setItens((atual) => atual.filter((i) => i.id !== id)),
      limpar: () => setItens([]),
    };
  }, [itens]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSacola() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSacola precisa estar dentro de SacolaProvider");
  return ctx;
}
