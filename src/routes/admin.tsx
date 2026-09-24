import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Eye, EyeOff, Loader2, LogOut, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBanners } from "@/components/florata/AdminBanners";
import { AdminRastreamento } from "@/components/florata/AdminRastreamento";
import { ImportarProdutos } from "@/components/florata/ImportarProdutos";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { formatarPreco, gerarSlug, listarImagens, CATEGORIA_DESTAQUE, type Produto } from "@/lib/florata";
import { GaleriaImagens, type ItemGaleria } from "@/components/florata/GaleriaImagens";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel administrativo | Florata" },
      { name: "description", content: "Gerencie os produtos do catálogo Florata." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel administrativo | Florata" },
      { property: "og:description", content: "Gerencie os produtos do catálogo Florata." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (carregando) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return session ? <Painel /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) toast.error("E-mail ou senha inválidos");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-accent/25 px-4">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-primary">Florata</h1>
          <p className="text-xs tracking-brand text-muted-foreground uppercase">Administração</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <Button type="submit" variant="gold" className="w-full" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

type FormProduto = {
  id?: string;
  nome: string;
  slug: string;
  categoria: string;
  subcategoria: string;
  tamanho: string;
  preco: string;
  descricao: string;
  disponivel: boolean;
  visivel: boolean;
  quantidade: string;
  imagem_url: string | null;
  imagens: string[];
  video_url: string;
};

const vazio: FormProduto = {
  nome: "",
  slug: "",
  categoria: "",
  subcategoria: "",
  tamanho: "",
  preco: "",
  descricao: "",
  disponivel: true,
  visivel: true,
  quantidade: "1",

  imagem_url: null,
  imagens: [],
  video_url: "",
};

function Painel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormProduto | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [subcategoria, setSubcategoria] = useState("todas");
  const [visibilidade, setVisibilidade] = useState("todos");
  const [disponibilidade, setDisponibilidade] = useState("todos");
  const [ordem, setOrdem] = useState("recentes");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [lote, setLote] = useState<string[] | null>(null);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["produtos-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Produto[];
    },
  });

  const categorias = useMemo(
    () => Array.from(new Set((produtos ?? []).map((p) => p.categoria).filter(Boolean))).sort(),
    [produtos],
  );

  // Subcategorias da categoria escolhida (ou de todos os produtos, se "todas").
  const subcategorias = useMemo(() => {
    const base =
      categoria === "todas"
        ? (produtos ?? [])
        : (produtos ?? []).filter((p) => p.categoria === categoria);
    return Array.from(new Set(base.map((p) => p.subcategoria).filter((s): s is string => !!s))).sort();
  }, [produtos, categoria]);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let itens = (produtos ?? []).filter((p) => {
      const casaBusca =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo) ||
        (p.descricao ?? "").toLowerCase().includes(termo);
      const casaCategoria = categoria === "todas" || p.categoria === categoria;
      const casaSubcategoria = subcategoria === "todas" || p.subcategoria === subcategoria;
      const casaVisibilidade =
        visibilidade === "todos" ||
        (visibilidade === "visiveis" ? p.visivel : !p.visivel);
      const casaDisponibilidade =
        disponibilidade === "todos" ||
        (disponibilidade === "disponiveis" ? p.disponivel : !p.disponivel);
      return casaBusca && casaCategoria && casaSubcategoria && casaVisibilidade && casaDisponibilidade;
    });
    itens = [...itens];
    if (ordem === "preco-asc") itens.sort((a, b) => Number(a.preco) - Number(b.preco));
    else if (ordem === "preco-desc") itens.sort((a, b) => Number(b.preco) - Number(a.preco));
    else if (ordem === "az") itens.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    else if (ordem === "za") itens.sort((a, b) => b.nome.localeCompare(a.nome, "pt-BR"));
    return itens;
  }, [produtos, busca, categoria, subcategoria, visibilidade, disponibilidade, ordem]);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["produtos-admin"] });
    queryClient.invalidateQueries({ queryKey: ["produtos"] });
  }

  async function alternarDisponibilidade(p: Produto) {
    const { error } = await supabase
      .from("produtos")
      .update({ disponivel: !p.disponivel })
      .eq("id", p.id);
    if (error) {
      toast.error("Não foi possível atualizar");
      return;
    }
    toast.success(!p.disponivel ? "Produto disponível" : "Produto marcado como esgotado");
    invalidar();
  }

  async function alternarVisibilidade(p: Produto) {
    const { error } = await supabase
      .from("produtos")
      .update({ visivel: !p.visivel })
      .eq("id", p.id);
    if (error) {
      toast.error("Não foi possível atualizar");
      return;
    }
    toast.success(!p.visivel ? "Produto visível na loja" : "Produto oculto da loja");
    invalidar();
  }

  async function remover(p: Produto) {
    if (!confirm(`Remover "${p.nome}"?`)) return;
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
    if (error) {
      toast.error("Não foi possível remover");
      return;
    }
    toast.success("Produto removido");
    setSelecionados([]);
    invalidar();
  }

  const idsVisiveis = listaFiltrada.map((p) => p.id);
  const selecionadosVisiveis = selecionados.filter((id) => idsVisiveis.includes(id));
  const todosSelecionados =
    idsVisiveis.length > 0 && selecionadosVisiveis.length === idsVisiveis.length;

  function alternarSelecao(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  const ultimoClicadoRef = useRef<string | null>(null);

  function selecionarComShift(id: string, evento: React.MouseEvent) {
    if (evento.shiftKey && ultimoClicadoRef.current) {
      const ids = listaFiltrada.map((p) => p.id);
      const indiceAtual = ids.indexOf(id);
      const indiceUltimo = ids.indexOf(ultimoClicadoRef.current);
      if (indiceAtual !== -1 && indiceUltimo !== -1) {
        const [inicio, fim] =
          indiceAtual < indiceUltimo ? [indiceAtual, indiceUltimo] : [indiceUltimo, indiceAtual];
        const intervalo = ids.slice(inicio, fim + 1);
        setSelecionados((atual) => Array.from(new Set([...atual, ...intervalo])));
        ultimoClicadoRef.current = id;
        return;
      }
    }
    alternarSelecao(id);
    ultimoClicadoRef.current = id;
  }

  function editarSelecionado() {
    if (selecionadosVisiveis.length > 1) {
      setLote(selecionadosVisiveis);
      return;
    }
    const p = (produtos ?? []).find((x) => x.id === selecionadosVisiveis[0]);
    if (!p) return;
    setForm({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      categoria: p.categoria,
      subcategoria: p.subcategoria ?? "",
      tamanho: p.tamanho ?? "",
      preco: String(p.preco),
      descricao: p.descricao ?? "",
      disponivel: p.disponivel,
      visivel: p.visivel,
      quantidade: p.quantidade != null ? String(p.quantidade) : "",
      imagem_url: p.imagem_url,
      imagens: listarImagens(p),
      video_url: p.video_url ?? "",
    });
  }

  async function removerSelecionados() {
    if (selecionadosVisiveis.length === 0) return;
    if (
      !confirm(
        selecionadosVisiveis.length === 1
          ? "Remover o produto selecionado?"
          : `Remover ${selecionadosVisiveis.length} produtos selecionados?`,
      )
    )
      return;
    const { error } = await supabase.from("produtos").delete().in("id", selecionadosVisiveis);
    if (error) {
      toast.error("Não foi possível remover");
      return;
    }
    toast.success("Produtos removidos");
    setSelecionados([]);
    invalidar();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold text-primary">
              Produtos Florata
            </h1>
            <p className="text-xs text-muted-foreground">{produtos?.length ?? 0} cadastrados</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="gold" onClick={() => setForm({ ...vazio })}>
              <Plus className="h-4 w-4" /> Novo
            </Button>
            <ImportarProdutos />
            <Button
              variant="outline"
              size="icon"
              aria-label="Sair"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await supabase.auth.signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="produtos">
          <TabsList>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="space-y-4 pt-4">
        <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, categoria ou descrição"
              className="pl-9"
              aria-label="Buscar produtos"
            />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <select
            aria-label="Filtrar por categoria"
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              setSubcategoria("todas");
            }}
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {subcategorias.length > 0 && (
            <select
              aria-label="Filtrar por subcategoria"
              value={subcategoria}
              onChange={(e) => setSubcategoria(e.target.value)}
              className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="todas">Todas as subcategorias</option>
              {subcategorias.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Filtrar por visibilidade"
            value={visibilidade}
            onChange={(e) => setVisibilidade(e.target.value)}
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="todos">Visíveis e ocultos</option>
            <option value="visiveis">Só visíveis</option>
            <option value="ocultos">Só ocultos da loja</option>
          </select>
          <select
            aria-label="Filtrar por disponibilidade"
            value={disponibilidade}
            onChange={(e) => setDisponibilidade(e.target.value)}
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="todos">Disponíveis e esgotados</option>
            <option value="disponiveis">Só disponíveis</option>
            <option value="esgotados">Só esgotados</option>
          </select>
          <select
            aria-label="Ordenar produtos"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="recentes">Mais recentes</option>
            <option value="az">Nome (A-Z)</option>
            <option value="za">Nome (Z-A)</option>
            <option value="preco-asc">Menor preço</option>
            <option value="preco-desc">Maior preço</option>
          </select>
        </div>

        {listaFiltrada.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-accent/20 px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={todosSelecionados}
                onCheckedChange={(v: boolean | "indeterminate") => setSelecionados(v === true ? idsVisiveis : [])}
                aria-label="Selecionar todos"
              />
              Selecionar todos
            </label>
            <span className="text-xs text-muted-foreground">
              {selecionadosVisiveis.length} selecionado(s)
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selecionadosVisiveis.length === 0}
                onClick={editarSelecionado}
              >
                <Pencil className="h-4 w-4" />{" "}
                {selecionadosVisiveis.length > 1 ? "Editar em massa" : "Editar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selecionadosVisiveis.length === 0}
                onClick={removerSelecionados}
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : listaFiltrada.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {(produtos ?? []).length === 0
              ? "Nenhum produto cadastrado ainda."
              : "Nenhum produto encontrado com esses filtros."}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {listaFiltrada.map((p) => (
              <li key={p.id} className="flex items-center gap-3 bg-card p-3">
                <Checkbox
                  checked={selecionados.includes(p.id)}
                  onClick={(e) => selecionarComShift(p.id, e)}
                  aria-label={`Selecionar ${p.nome}`}
                />
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-accent/40">
                  {p.imagem_url && (
                    <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-primary">{p.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.categoria}
                    {p.tamanho ? ` · ${p.tamanho}` : ""} · {formatarPreco(Number(p.preco))}
                    {p.quantidade != null ? ` · ${p.quantidade} un.` : ""}
                  </p>
                  <p className="text-xs">
                    {p.disponivel ? (
                      <span className="text-primary">Disponível</span>
                    ) : (
                      <span className="text-destructive">Esgotado</span>
                    )}
                    {!p.visivel && <span className="text-destructive"> · Oculto da loja</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={p.disponivel}
                    onCheckedChange={() => alternarDisponibilidade(p)}
                    aria-label="Disponibilidade"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={p.visivel ? "Ocultar da loja" : "Tornar visível na loja"}
                    onClick={() => alternarVisibilidade(p)}
                  >
                    {p.visivel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Editar"
                    onClick={() =>
                      setForm({
                        id: p.id,
                        nome: p.nome,
                        slug: p.slug,
                        categoria: p.categoria,
                        subcategoria: p.subcategoria ?? "",
                        tamanho: p.tamanho ?? "",
                        preco: String(p.preco),
                        descricao: p.descricao ?? "",
                        disponivel: p.disponivel,
                        visivel: p.visivel,
                        quantidade: p.quantidade != null ? String(p.quantidade) : "",
                        imagem_url: p.imagem_url,
                        imagens: listarImagens(p),
                        video_url: p.video_url ?? "",
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Remover"
                    onClick={() => remover(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
          </TabsContent>

          <TabsContent value="banners" className="pt-4">
            <AdminBanners />
          </TabsContent>

          <TabsContent value="integracoes" className="pt-4">
            <AdminRastreamento />
          </TabsContent>
        </Tabs>
      </main>

      <FormularioProduto
        form={form}
        onFechar={() => setForm(null)}
        onSalvo={() => {
          setForm(null);
          invalidar();
        }}
      />

      <FormularioLote
        produtos={produtos ?? []}
        ids={lote}
        onFechar={() => setLote(null)}
        onSalvo={() => {
          setLote(null);
          setSelecionados([]);
          invalidar();
        }}
      />
    </div>
  );
}

type LinhaLote = {
  id: string;
  nome: string;
  categoria: string;
  tamanho: string;
  preco: string;
  quantidade: string;
  descricao: string;
  disponivel: boolean;
  visivel: boolean;
};

type CampoTexto = "nome" | "categoria" | "tamanho" | "preco" | "quantidade" | "descricao";

const PADRAO_VAZIO = {
  nome: "",
  categoria: "",
  tamanho: "",
  preco: "",
  quantidade: "",
  descricao: "",
};

function FormularioLote({
  produtos,
  ids,
  onFechar,
  onSalvo,
}: {
  produtos: Produto[];
  ids: string[] | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [linhas, setLinhas] = useState<LinhaLote[]>([]);
  const [padrao, setPadrao] = useState({ ...PADRAO_VAZIO });
  const [salvando, setSalvando] = useState(false);
  const [localizar, setLocalizar] = useState("");
  const [substituir, setSubstituir] = useState("");
  const [campoAlvo, setCampoAlvo] = useState<"todos" | CampoTexto>("todos");

  function aplicarSubstituicao() {
    if (!localizar) {
      toast.error("Informe o texto a localizar");
      return;
    }
    const campos: CampoTexto[] =
      campoAlvo === "todos"
        ? ["nome", "categoria", "tamanho", "preco", "quantidade", "descricao"]
        : [campoAlvo];
    let trocas = 0;
    setLinhas((atual) =>
      atual.map((l) => {
        const nova = { ...l };
        campos.forEach((c) => {
          const valor = nova[c];
          if (valor.includes(localizar)) {
            trocas += 1;
            nova[c] = valor.split(localizar).join(substituir);
          }
        });
        return nova;
      }),
    );
    toast.success(trocas ? `${trocas} campo(s) alterado(s)` : "Nenhuma ocorrência encontrada");
  }


  useEffect(() => {
    if (!ids) return;
    setPadrao({ ...PADRAO_VAZIO });
    setLinhas(
      ids
        .map((id) => produtos.find((p) => p.id === id))
        .filter((p): p is Produto => !!p)
        .map((p) => ({
          id: p.id,
          nome: p.nome,
          categoria: p.categoria,
          tamanho: p.tamanho ?? "",
          preco: String(p.preco),
          quantidade: p.quantidade != null ? String(p.quantidade) : "",
          descricao: p.descricao ?? "",
          disponivel: p.disponivel,
          visivel: p.visivel,
        })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  function alterar(id: string, campo: keyof LinhaLote, valor: string | boolean) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  function aplicarPadrao(campo: CampoTexto, valor: string) {
    setPadrao((p) => ({ ...p, [campo]: valor }));
    setLinhas((atual) => atual.map((l) => ({ ...l, [campo]: valor })));
  }

  function aplicarDisponibilidade(valor: boolean) {
    setLinhas((atual) => atual.map((l) => ({ ...l, disponivel: valor })));
  }

  function aplicarVisibilidade(valor: boolean) {
    setLinhas((atual) => atual.map((l) => ({ ...l, visivel: valor })));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (linhas.some((l) => !l.nome.trim() || !l.categoria.trim())) {
      toast.error("Nome e categoria são obrigatórios em todos os produtos");
      return;
    }
    setSalvando(true);
    const resultados = await Promise.all(
      linhas.map((l) => {
        const payload: TablesUpdate<"produtos"> = {
          nome: l.nome.trim(),
          categoria: l.categoria.trim(),
          tamanho: l.tamanho.trim() || null,
          preco: Number(l.preco.replace(",", ".")) || 0,
          quantidade: l.quantidade ? Number(l.quantidade) : null,
          descricao: l.descricao.trim() || null,
          disponivel: l.disponivel,
          visivel: l.visivel,
        };
        return supabase.from("produtos").update(payload).eq("id", l.id);
      }),
    );
    setSalvando(false);
    if (resultados.some((r) => r.error)) {
      toast.error("Não foi possível salvar todas as alterações");
      return;
    }
    toast.success(`${linhas.length} produtos atualizados`);
    onSalvo();
  }

  const colunas =
    "grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr_2fr_auto_auto] gap-2 min-w-[980px] items-start";

  return (
    <Dialog open={!!ids} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold text-primary">
            Editar {linhas.length} produtos
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          A primeira linha é o campo padrão: o que for digitado nela é aplicado a todos os produtos
          abaixo. Depois, edite cada produto individualmente, campo a campo.
        </p>

        <div className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
          <div className="space-y-1">
            <Label htmlFor="lr-buscar" className="text-xs">
              Localizar
            </Label>
            <Input
              id="lr-buscar"
              value={localizar}
              className="h-9 w-40"
              onChange={(e) => setLocalizar(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lr-sub" className="text-xs">
              Substituir por
            </Label>
            <Input
              id="lr-sub"
              value={substituir}
              className="h-9 w-40"
              onChange={(e) => setSubstituir(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lr-campo" className="text-xs">
              Campo
            </Label>
            <select
              id="lr-campo"
              value={campoAlvo}
              onChange={(e) => setCampoAlvo(e.target.value as "todos" | CampoTexto)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="todos">Todos os campos</option>
              <option value="nome">Nome</option>
              <option value="categoria">Categoria</option>
              <option value="tamanho">Tamanho</option>
              <option value="preco">Preço</option>
              <option value="quantidade">Quantidade</option>
              <option value="descricao">Descrição</option>
            </select>
          </div>
          <Button type="button" variant="outline" className="h-9" onClick={aplicarSubstituicao}>
            Substituir
          </Button>
        </div>


        <form onSubmit={salvar} className="space-y-3">
          <div className="overflow-x-auto pb-2">
            <div className="space-y-2">
              <div className={`${colunas} text-xs font-medium tracking-wide text-muted-foreground uppercase`}>
                <span>Nome</span>
                <span>Categoria</span>
                <span>Tamanho</span>
                <span>Preço (R$)</span>
                <span>Quantidade</span>
                <span>Descrição</span>
                <span>Disponível</span>
                <span>Visível</span>
              </div>

              <div className={`${colunas} rounded-md border border-gold bg-accent/40 p-2`}>
                <Input
                  value={padrao.nome}
                  placeholder="Padrão p/ todos"
                  onChange={(e) => aplicarPadrao("nome", e.target.value)}
                />
                <Input
                  value={padrao.categoria}
                  placeholder="Padrão"
                  onChange={(e) => aplicarPadrao("categoria", e.target.value)}
                />
                <Input
                  value={padrao.tamanho}
                  placeholder="Padrão"
                  onChange={(e) => aplicarPadrao("tamanho", e.target.value)}
                />
                <Input
                  inputMode="decimal"
                  value={padrao.preco}
                  placeholder="Padrão"
                  onChange={(e) => aplicarPadrao("preco", e.target.value)}
                />
                <Input
                  inputMode="numeric"
                  value={padrao.quantidade}
                  placeholder="Padrão"
                  onChange={(e) => aplicarPadrao("quantidade", e.target.value)}
                />
                <Textarea
                  rows={2}
                  value={padrao.descricao}
                  placeholder="Padrão p/ todos"
                  onChange={(e) => aplicarPadrao("descricao", e.target.value)}
                />
                <div className="flex h-9 items-center justify-center">
                  <Switch
                    checked={linhas.every((l) => l.disponivel)}
                    onCheckedChange={aplicarDisponibilidade}
                    aria-label="Disponibilidade padrão"
                  />
                </div>
                <div className="flex h-9 items-center justify-center">
                  <Switch
                    checked={linhas.every((l) => l.visivel)}
                    onCheckedChange={aplicarVisibilidade}
                    aria-label="Visibilidade padrão"
                  />
                </div>
              </div>

              {linhas.map((l) => (
                <div key={l.id} className={`${colunas} rounded-md border border-border p-2`}>
                  <Input
                    value={l.nome}
                    maxLength={120}
                    onChange={(e) => alterar(l.id, "nome", e.target.value)}
                  />
                  <Input
                    value={l.categoria}
                    maxLength={60}
                    onChange={(e) => alterar(l.id, "categoria", e.target.value)}
                  />
                  <Input
                    value={l.tamanho}
                    maxLength={30}
                    onChange={(e) => alterar(l.id, "tamanho", e.target.value)}
                  />
                  <Input
                    inputMode="decimal"
                    value={l.preco}
                    onChange={(e) => alterar(l.id, "preco", e.target.value)}
                  />
                  <Input
                    inputMode="numeric"
                    value={l.quantidade}
                    onChange={(e) => alterar(l.id, "quantidade", e.target.value)}
                  />
                  <Textarea
                    rows={2}
                    value={l.descricao}
                    maxLength={600}
                    onChange={(e) => alterar(l.id, "descricao", e.target.value)}
                  />
                  <div className="flex h-9 items-center justify-center">
                    <Switch
                      checked={l.disponivel}
                      onCheckedChange={(v) => alterar(l.id, "disponivel", v)}
                      aria-label={`Disponibilidade de ${l.nome}`}
                    />
                  </div>
                  <div className="flex h-9 items-center justify-center">
                    <Switch
                      checked={l.visivel}
                      onCheckedChange={(v) => alterar(l.id, "visivel", v)}
                      aria-label={`Visibilidade de ${l.nome}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={salvando}>
            {salvando ? "Salvando..." : `Salvar ${linhas.length} produtos`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}



function FormularioProduto({
  form,
  onFechar,
  onSalvo,
}: {
  form: FormProduto | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [dados, setDados] = useState<FormProduto>(vazio);
  const [itens, setItens] = useState<ItemGaleria[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (form) {
      setDados(form);
      setItens(form.imagens.map((url) => ({ status: "existente", url })));
    }
  }, [form]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!dados.nome.trim() || !dados.categoria.trim()) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }
    setSalvando(true);
    try {
      const imagens: string[] = [];
      for (const item of itens) {
        if (item.status === "existente") {
          imagens.push(item.url);
          continue;
        }
        const ext = item.file.name.split(".").pop() ?? "jpg";
        const caminho = `${crypto.randomUUID()}.${ext}`;
        const { error: erroUpload } = await supabase.storage
          .from("produtos")
          .upload(caminho, item.file, { contentType: item.file.type });
        if (erroUpload) throw erroUpload;
        const { data: assinada, error: erroUrl } = await supabase.storage
          .from("produtos")
          .createSignedUrl(caminho, 60 * 60 * 24 * 365 * 10);
        if (erroUrl) throw erroUrl;
        imagens.push(assinada.signedUrl);
      }

      const imagem_url = imagens[0] ?? null;

      const base = {
        nome: dados.nome.trim(),
        slug: dados.slug.trim() ? gerarSlug(dados.slug) : null,
        categoria: dados.categoria.trim(),
        subcategoria: dados.subcategoria.trim() || null,
        preco: Number(dados.preco.replace(",", ".")) || 0,
        descricao: dados.descricao.trim() || null,
        disponivel: dados.disponivel,
        visivel: dados.visivel,
        quantidade: dados.quantidade ? Number(dados.quantidade) : null,
        imagem_url,
        imagens,
        video_url: dados.video_url.trim() || null,
      };

      const tamanhos = dados.tamanho
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const linha = { ...base, tamanho: tamanhos.join(", ") || null };

      if (dados.id) {
        const resposta = await supabase.from("produtos").update(linha).eq("id", dados.id);
        if (resposta.error) throw resposta.error;
        toast.success("Produto atualizado");
      } else {
        const resposta = await supabase.from("produtos").insert([linha as TablesInsert<"produtos">]);
        if (resposta.error) throw resposta.error;
        toast.success("Produto cadastrado");
      }


      onSalvo();
    } catch (erro) {
      if (
        erro &&
        typeof erro === "object" &&
        "code" in erro &&
        (erro as { code?: string }).code === "23505"
      ) {
        toast.error("Esse link (slug) já está em uso por outro produto — escolha outro.");
      } else {
        toast.error("Não foi possível salvar o produto");
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={!!form} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold text-primary">
            {dados.id ? "Editar produto" : "Novo produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-nome">Nome</Label>
            <Input
              id="p-nome"
              value={dados.nome}
              maxLength={120}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-slug">Link do produto</Label>
            <Input
              id="p-slug"
              value={dados.slug}
              maxLength={80}
              placeholder={gerarSlug(dados.nome) || "gerado automaticamente"}
              onChange={(e) => setDados({ ...dados, slug: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              .../produto/{dados.slug.trim() ? gerarSlug(dados.slug) : gerarSlug(dados.nome) || "..."}
              {dados.id
                ? " — mudar isso quebra um link já compartilhado."
                : " — deixe em branco pra gerar a partir do nome."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Categoria</Label>
              <Input
                id="p-cat"
                value={dados.categoria}
                maxLength={60}
                onChange={(e) => setDados({ ...dados, categoria: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-subcat">Subcategoria</Label>
              <Input
                id="p-subcat"
                value={dados.subcategoria}
                maxLength={60}
                placeholder="Opcional"
                onChange={(e) => setDados({ ...dados, subcategoria: e.target.value })}
              />
              {dados.categoria.trim().toLowerCase() === CATEGORIA_DESTAQUE.toLowerCase() && (
                <p className="text-[11px] text-muted-foreground">
                  Vira filtro na página de {CATEGORIA_DESTAQUE}.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-tam">Tamanho(s)</Label>
            <Input
              id="p-tam"
              value={dados.tamanho}
              maxLength={120}
              placeholder="Ex.: 16, 17, 18"
              onChange={(e) => setDados({ ...dados, tamanho: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Separe por vírgula: o cliente escolhe o tamanho na página do produto.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-preco">Preço (R$)</Label>
              <Input
                id="p-preco"
                inputMode="decimal"
                value={dados.preco}
                onChange={(e) => setDados({ ...dados, preco: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-qtd">Quantidade</Label>
              <Input
                id="p-qtd"
                inputMode="numeric"
                value={dados.quantidade}
                placeholder="Opcional"
                onChange={(e) => setDados({ ...dados, quantidade: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descrição</Label>
            <Textarea
              id="p-desc"
              value={dados.descricao}
              maxLength={600}
              onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fotos</Label>
            <GaleriaImagens itens={itens} onChange={setItens} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-video">Vídeo (link do YouTube ou Drive)</Label>
            <Input
              id="p-video"
              value={dados.video_url}
              placeholder="Opcional"
              onChange={(e) => setDados({ ...dados, video_url: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Cole o link normal do YouTube ou do Google Drive (com o Drive, o arquivo precisa
              estar compartilhado como "Qualquer pessoa com o link pode ver").
            </p>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="p-disp">Disponível para venda</Label>
            <Switch
              id="p-disp"
              checked={dados.disponivel}
              onCheckedChange={(v) => setDados({ ...dados, disponivel: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="p-vis">Visível na loja</Label>
              <p className="text-[11px] text-muted-foreground">
                Desligue pra tirar o produto do catálogo sem excluí-lo.
              </p>
            </div>
            <Switch
              id="p-vis"
              checked={dados.visivel}
              onCheckedChange={(v) => setDados({ ...dados, visivel: v })}
            />
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
