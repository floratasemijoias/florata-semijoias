import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { formatarPreco } from "@/lib/florata";
import {
  detectarDelimitador,
  normalizarCabecalhos,
  normalizarTamanho,
  parseCSV,
  parseDisponivel,
  parsePreco,
  parseQuantidade,
} from "@/lib/csv";

type LinhaImportada = {
  nome: string;
  categoria: string;
  tamanho: string | null;
  preco: number | null;
  quantidade: number | null;
  descricao: string | null;
  disponivel: boolean;
  erro: string | null;
};

const CAMPOS_ESPERADOS = ["nome", "categoria", "tamanho", "preco", "quantidade", "descricao", "disponivel"];

function baixarModelo() {
  const cabecalho = "nome;categoria;tamanho;preco;quantidade;descricao;disponivel";
  const exemplo1 = 'Colar Gota Dourada;Colares;Único;129,90;5;Colar folheado a ouro com pingente gota;sim';
  const exemplo2 = "Brinco Argola Pequena;Brincos;P, M;79,50;10;;sim";
  const conteudo = "\uFEFF" + [cabecalho, exemplo1, exemplo2].join("\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-produtos-florata.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function processarArquivo(texto: string): LinhaImportada[] {
  const delimitador = detectarDelimitador(texto);
  const linhas = parseCSV(texto, delimitador);
  if (linhas.length < 2) return [];

  const [cabecalhoBruto, ...resto] = linhas;
  const mapeamento = normalizarCabecalhos(cabecalhoBruto);

  return resto
    .filter((linha) => linha.some((c) => c.trim() !== ""))
    .map((linha) => {
      const registro: Record<string, string> = {};
      mapeamento.forEach((campo, idx) => {
        if (campo) registro[campo] = linha[idx] ?? "";
      });

      const nome = (registro.nome ?? "").trim();
      const categoria = (registro.categoria ?? "").trim();
      const preco = registro.preco !== undefined ? parsePreco(registro.preco) : null;

      let erro: string | null = null;
      if (!nome) erro = "Nome é obrigatório";
      else if (!categoria) erro = "Categoria é obrigatória";
      else if (registro.preco !== undefined && registro.preco.trim() !== "" && preco === null)
        erro = "Preço inválido";

      return {
        nome,
        categoria,
        tamanho: registro.tamanho ? normalizarTamanho(registro.tamanho) : null,
        preco,
        quantidade: registro.quantidade ? parseQuantidade(registro.quantidade) : null,
        descricao: registro.descricao?.trim() || null,
        disponivel: registro.disponivel !== undefined ? parseDisponivel(registro.disponivel) : true,
        erro,
      };
    });
}

export function ImportarProdutos() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [linhas, setLinhas] = useState<LinhaImportada[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [importando, setImportando] = useState(false);

  const validas = linhas.filter((l) => !l.erro);
  const invalidas = linhas.filter((l) => l.erro);

  function fechar() {
    setAberto(false);
    setLinhas([]);
    setNomeArquivo("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setNomeArquivo(arquivo.name);
    const leitor = new FileReader();
    leitor.onload = () => {
      const texto = String(leitor.result ?? "");
      const processadas = processarArquivo(texto);
      if (processadas.length === 0) {
        toast.error("Não encontrei linhas de produtos nesse arquivo");
        return;
      }
      setLinhas(processadas);
    };
    leitor.onerror = () => toast.error("Não foi possível ler o arquivo");
    leitor.readAsText(arquivo, "utf-8");
  }

  async function importar() {
    if (validas.length === 0) return;
    setImportando(true);
    try {
      const payload: TablesInsert<"produtos">[] = validas.map((l) => ({
        nome: l.nome,
        categoria: l.categoria,
        tamanho: l.tamanho,
        preco: l.preco ?? 0,
        quantidade: l.quantidade,
        descricao: l.descricao,
        disponivel: l.disponivel,
      }));

      const TAMANHO_LOTE = 500;
      for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
        const fatia = payload.slice(i, i + TAMANHO_LOTE);
        const { error } = await supabase.from("produtos").insert(fatia);
        if (error) throw error;
      }

      toast.success(
        invalidas.length > 0
          ? `${validas.length} produtos importados · ${invalidas.length} ignorados por erro`
          : `${validas.length} produtos importados`,
      );
      queryClient.invalidateQueries({ queryKey: ["produtos-admin"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      fechar();
    } catch {
      toast.error("Não foi possível importar os produtos");
    } finally {
      setImportando(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <FileUp className="h-4 w-4" /> Importar
      </Button>

      <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold text-primary">
              Importar produtos em lote
            </DialogTitle>
          </DialogHeader>

          {linhas.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envie uma planilha CSV com os produtos. As colunas aceitas são:{" "}
                <span className="font-medium text-foreground">
                  {CAMPOS_ESPERADOS.join(", ")}
                </span>
                . Apenas <span className="font-medium text-foreground">nome</span> e{" "}
                <span className="font-medium text-foreground">categoria</span> são obrigatórios. As
                fotos não entram na planilha — adicione depois, editando cada produto.
              </p>

              <Button type="button" variant="ghost" size="sm" onClick={baixarModelo}>
                Baixar planilha modelo
              </Button>

              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={selecionarArquivo}
                  className="mx-auto block w-full max-w-xs text-sm"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Arquivo .csv exportado do Excel, Google Sheets ou Numbers
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="truncate text-muted-foreground">{nomeArquivo}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="h-4 w-4" /> {validas.length} prontos
                  </span>
                  {invalidas.length > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-4 w-4" /> {invalidas.length} com erro
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-[45vh] overflow-auto rounded-md border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-accent/40">
                    <tr>
                      <th className="p-2">Nome</th>
                      <th className="p-2">Categoria</th>
                      <th className="p-2">Tamanho</th>
                      <th className="p-2">Preço</th>
                      <th className="p-2">Qtd.</th>
                      <th className="p-2">Disponível</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l, idx) => (
                      <tr
                        key={idx}
                        className={`border-t border-border ${l.erro ? "bg-destructive/10" : ""}`}
                      >
                        <td className="p-2">
                          {l.nome || <span className="text-destructive">—</span>}
                          {l.erro && <p className="text-[10px] text-destructive">{l.erro}</p>}
                        </td>
                        <td className="p-2">{l.categoria || "—"}</td>
                        <td className="p-2">{l.tamanho ?? "—"}</td>
                        <td className="p-2">{l.preco != null ? formatarPreco(l.preco) : "—"}</td>
                        <td className="p-2">{l.quantidade ?? "—"}</td>
                        <td className="p-2">{l.disponivel ? "Sim" : "Não"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={fechar}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="gold"
                  className="flex-1"
                  disabled={validas.length === 0 || importando}
                  onClick={importar}
                >
                  {importando ? "Importando..." : `Importar ${validas.length} produtos`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
