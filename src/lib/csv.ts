/**
 * Parser de CSV leve, sem dependências externas.
 * Suporta campos entre aspas (com vírgula, ponto e vírgula ou quebra de linha dentro),
 * aspas escapadas ("") e detecta automaticamente se o delimitador é "," ou ";"
 * (planilhas do Excel em pt-BR costumam exportar com ";").
 */
export function detectarDelimitador(texto: string): "," | ";" {
  const primeiraLinha = texto.split(/\r\n|\r|\n/, 1)[0] ?? "";
  const virgulas = (primeiraLinha.match(/,/g) ?? []).length;
  const pontoVirgulas = (primeiraLinha.match(/;/g) ?? []).length;
  return pontoVirgulas > virgulas ? ";" : ",";
}

export function parseCSV(texto: string, delimitador: "," | ";" = ","): string[][] {
  const linhas: string[][] = [];
  let linhaAtual: string[] = [];
  let campo = "";
  let entreAspas = false;

  const s = texto.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (entreAspas) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      entreAspas = true;
    } else if (c === delimitador) {
      linhaAtual.push(campo);
      campo = "";
    } else if (c === "\n") {
      linhaAtual.push(campo);
      linhas.push(linhaAtual);
      linhaAtual = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo.length > 0 || linhaAtual.length > 0) {
    linhaAtual.push(campo);
    linhas.push(linhaAtual);
  }

  return linhas
    .map((l) => l.map((c) => c.trim()))
    .filter((l) => !(l.length === 1 && l[0] === ""));
}

function normalizarTexto(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const ALIASES_CABECALHO: Record<string, string> = {
  nome: "nome",
  produto: "nome",
  categoria: "categoria",
  tamanho: "tamanho",
  tamanhos: "tamanho",
  preco: "preco",
  valor: "preco",
  quantidade: "quantidade",
  qtd: "quantidade",
  estoque: "quantidade",
  descricao: "descricao",
  disponivel: "disponivel",
  status: "disponivel",
  ativo: "disponivel",
};

export function normalizarCabecalhos(cabecalhos: string[]): (string | null)[] {
  return cabecalhos.map((h) => ALIASES_CABECALHO[normalizarTexto(h)] ?? null);
}

const VALORES_VERDADEIRO = ["sim", "s", "true", "verdadeiro", "1", "disponivel", "ativo", "yes"];
const VALORES_FALSO = ["nao", "não", "n", "false", "falso", "0", "esgotado", "indisponivel", "inativo", "no"];

export function parseDisponivel(v: string): boolean {
  const norm = normalizarTexto(v);
  if (!norm) return true;
  if (VALORES_FALSO.includes(norm)) return false;
  if (VALORES_VERDADEIRO.includes(norm)) return true;
  return true;
}

export function parsePreco(v: string): number | null {
  let limpo = v.replace(/[^\d.,-]/g, "").trim();
  if (!limpo) return null;
  const temVirgula = limpo.includes(",");
  const temPonto = limpo.includes(".");
  if (temVirgula && temPonto) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    limpo = limpo.replace(",", ".");
  }
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

export function parseQuantidade(v: string): number | null {
  const limpo = v.replace(/\D/g, "");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

export function normalizarTamanho(v: string): string | null {
  const partes = v
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return partes.length ? partes.join(", ") : null;
}
