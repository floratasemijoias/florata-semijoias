// Codifica os itens do pedido dentro da própria URL (sem precisar de banco de
// dados novo) — compacto o bastante pra caber numa mensagem de WhatsApp.
export type ItemResumoCodificado = { s: string; q: number; t: string | null };

export function codificarItensResumo(
  itens: { slug?: string; quantidade: number; tamanho: string | null }[],
): string {
  const compacto: ItemResumoCodificado[] = itens
    .filter((i): i is typeof i & { slug: string } => !!i.slug)
    .map((i) => ({ s: i.slug, q: i.quantidade, t: i.tamanho }));
  const json = JSON.stringify(compacto);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodificarItensResumo(valor: string): ItemResumoCodificado[] {
  try {
    const b64 = valor.replace(/-/g, "+").replace(/_/g, "/");
    const preenchimento = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = decodeURIComponent(escape(atob(b64 + preenchimento)));
    const dados = JSON.parse(json);
    if (!Array.isArray(dados)) return [];
    return dados.filter(
      (i): i is ItemResumoCodificado =>
        !!i && typeof i.s === "string" && typeof i.q === "number",
    );
  } catch {
    return [];
  }
}
