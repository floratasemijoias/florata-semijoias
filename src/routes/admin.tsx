import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2, LogOut, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AdminBanners } from "@/components/florata/AdminBanners";
import { supabase } from "@/integrations/supabase/client";
import { formatarPreco, type Produto } from "@/lib/florata";

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
  categoria: string;
  tamanho: string;
  preco: string;
  descricao: string;
  disponivel: boolean;
  quantidade: string;
  imagem_url: string | null;
};

const vazio: FormProduto = {
  nome: "",
  categoria: "",
  tamanho: "",
  preco: "",
  descricao: "",
  disponivel: true,
  quantidade: "",
  imagem_url: null,
};

function Painel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormProduto | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [ordem, setOrdem] = useState("recentes");
  const [selecionados, setSelecionados] = useState<string[]>([]);

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

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let itens = (produtos ?? []).filter((p) => {
      const casaBusca =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo) ||
        (p.descricao ?? "").toLowerCase().includes(termo);
      const casaCategoria = categoria === "todas" || p.categoria === categoria;
      return casaBusca && casaCategoria;
    });
    itens = [...itens];
    if (ordem === "preco-asc") itens.sort((a, b) => Number(a.preco) - Number(b.preco));
    else if (ordem === "preco-desc") itens.sort((a, b) => Number(b.preco) - Number(a.preco));
    else if (ordem === "az") itens.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    else if (ordem === "za") itens.sort((a, b) => b.nome.localeCompare(a.nome, "pt-BR"));
    return itens;
  }, [produtos, busca, categoria, ordem]);

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

  function editarSelecionado() {
    const p = (produtos ?? []).find((x) => x.id === selecionadosVisiveis[0]);
    if (!p) return;
    setForm({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      tamanho: p.tamanho ?? "",
      preco: String(p.preco),
      descricao: p.descricao ?? "",
      disponivel: p.disponivel,
      quantidade: p.quantidade != null ? String(p.quantidade) : "",
      imagem_url: p.imagem_url,
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
        <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
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
          <select
            aria-label="Filtrar por categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="h-9 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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
                onCheckedChange={(v) => setSelecionados(v ? idsVisiveis : [])}
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
                disabled={selecionadosVisiveis.length !== 1}
                onClick={editarSelecionado}
              >
                <Pencil className="h-4 w-4" /> Editar
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
                  onCheckedChange={() => alternarSelecao(p.id)}
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
                    aria-label="Editar"
                    onClick={() =>
                      setForm({
                        id: p.id,
                        nome: p.nome,
                        categoria: p.categoria,
                        tamanho: p.tamanho ?? "",
                        preco: String(p.preco),
                        descricao: p.descricao ?? "",
                        disponivel: p.disponivel,
                        quantidade: p.quantidade != null ? String(p.quantidade) : "",
                        imagem_url: p.imagem_url,
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
      </main>

      <div className="mx-auto max-w-5xl px-4 pb-10">
        <AdminBanners />
      </div>

      <FormularioProduto
        form={form}
        onFechar={() => setForm(null)}
        onSalvo={() => {
          setForm(null);
          invalidar();
        }}
      />
    </div>
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
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (form) {
      setDados(form);
      setArquivo(null);
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
      let imagem_url = dados.imagem_url;

      if (arquivo) {
        const ext = arquivo.name.split(".").pop() ?? "jpg";
        const caminho = `${crypto.randomUUID()}.${ext}`;
        const { error: erroUpload } = await supabase.storage
          .from("produtos")
          .upload(caminho, arquivo, { contentType: arquivo.type });
        if (erroUpload) throw erroUpload;
        const { data: assinada, error: erroUrl } = await supabase.storage
          .from("produtos")
          .createSignedUrl(caminho, 60 * 60 * 24 * 365 * 10);
        if (erroUrl) throw erroUrl;
        imagem_url = assinada.signedUrl;
      }

      const payload = {
        nome: dados.nome.trim(),
        categoria: dados.categoria.trim(),
        tamanho: dados.tamanho.trim() || null,
        preco: Number(dados.preco.replace(",", ".")) || 0,
        descricao: dados.descricao.trim() || null,
        disponivel: dados.disponivel,
        quantidade: dados.quantidade ? Number(dados.quantidade) : null,
        imagem_url,
      };

      const resposta = dados.id
        ? await supabase.from("produtos").update(payload).eq("id", dados.id)
        : await supabase.from("produtos").insert(payload);

      if (resposta.error) throw resposta.error;
      toast.success(dados.id ? "Produto atualizado" : "Produto cadastrado");
      onSalvo();
    } catch {
      toast.error("Não foi possível salvar o produto");
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
              <Label htmlFor="p-tam">Tamanho</Label>
              <Input
                id="p-tam"
                value={dados.tamanho}
                maxLength={30}
                placeholder="P, M, G ou dimensão"
                onChange={(e) => setDados({ ...dados, tamanho: e.target.value })}
              />
            </div>
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
            <Label htmlFor="p-foto">Foto</Label>
            <Input
              id="p-foto"
              type="file"
              accept="image/*"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
            {dados.imagem_url && !arquivo && (
              <img
                src={dados.imagem_url}
                alt="Foto atual"
                className="mt-2 h-24 w-24 rounded-md object-cover"
              />
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="p-disp">Disponível para venda</Label>
            <Switch
              id="p-disp"
              checked={dados.disponivel}
              onCheckedChange={(v) => setDados({ ...dados, disponivel: v })}
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
