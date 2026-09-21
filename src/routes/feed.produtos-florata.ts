import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Produto } from "@/lib/florata";

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/feed/produtos-florata")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origem = new URL(request.url).origin;

        // A política pública do banco já só devolve produtos com visivel = true
        // pra quem não está logado — igual à loja.
        const { data, error } = await supabase
          .from("produtos")
          .select("*")
          .order("criado_em", { ascending: false });

        const produtos = (error ? [] : ((data ?? []) as Produto[])).filter(
          (p) => !!p.imagem_url,
        );

        const itens = produtos
          .map((p) => {
            const descricao =
              p.descricao?.trim() || `${p.nome} — ${p.categoria}. Semijoias Florata, prata 925.`;
            const preco = Number(p.preco).toFixed(2);
            return `
    <item>
      <g:id>${escaparXml(p.slug)}</g:id>
      <title>${escaparXml(p.nome)}</title>
      <description>${escaparXml(descricao)}</description>
      <link>${origem}/produto/${p.slug}</link>
      <g:image_link>${escaparXml(p.imagem_url!)}</g:image_link>
      <g:availability>${p.disponivel ? "in stock" : "out of stock"}</g:availability>
      <g:price>${preco} BRL</g:price>
      <g:condition>new</g:condition>
      <g:brand>Florata</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Jewelry</g:google_product_category>
    </item>`;
          })
          .join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Florata — Semijoias e Prata 925</title>
    <link>${origem}</link>
    <description>Catálogo de produtos Florata</description>${itens}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
