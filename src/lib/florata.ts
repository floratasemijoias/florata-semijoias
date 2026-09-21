export const WHATSAPP_NUMERO = "5551997897864";
export const PIX_CHAVE = "51997897864";

// Categoria fixada primeiro na lista de filtros (só quando tem produtos nela)
// e com página própria em /personalizados.
export const CATEGORIA_DESTAQUE = "Personalizados";

// Rótulo do filtro "ver tudo" — na home volta pra grade completa; na página
// de Personalizados, navega de volta pra home.
export const TODOS_PRODUTOS = "Todos Produtos";

export type Produto = {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  subcategoria: string | null;
  tamanho: string | null;
  preco: number;
  disponivel: boolean;
  visivel: boolean;
  quantidade: number | null;
  descricao: string | null;
  imagem_url: string | null;
  criado_em: string;
};

// Mesma lógica da geração automática no banco — usada aqui pra sanitizar um
// slug digitado manualmente antes de salvar (o gatilho do banco só GERA um
// slug quando o campo está vazio; não corrige um valor já preenchido).
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function listarTamanhos(tamanho: string | null | undefined) {
  return (tamanho ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

export function mascaraTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function linkWhatsApp(mensagem?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMERO}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export const BLOCOS_HORARIO = [
  "Manhã (09h - 12h)",
  "Tarde (13h - 17h)",
  "Fim da tarde (17h - 19h)",
];

export function formatarData(iso: string) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
