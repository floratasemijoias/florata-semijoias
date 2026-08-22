import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Banner } from "@/components/florata/Banners";

type FormBanner = {
  id?: string;
  alt: string;
  link: string;
  ordem: string;
  ativo: boolean;
  imagem_url: string | null;
};

const vazio: FormBanner = { alt: "", link: "", ordem: "0", ativo: true, imagem_url: null };

const LIMITE = 5;

export function AdminBanners() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormBanner | null>(null);

  const { data: banners } = useQuery({
    queryKey: ["banners-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const lista = banners ?? [];

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["banners-admin"] });
    queryClient.invalidateQueries({ queryKey: ["banners"] });
  }

  async function remover(b: Banner) {
    if (!confirm("Remover este banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", b.id);
    if (error) {
      toast.error("Não foi possível remover");
      return;
    }
    toast.success("Banner removido");
    invalidar();
  }

  async function alternar(b: Banner) {
    const { error } = await supabase.from("banners").update({ ativo: !b.ativo }).eq("id", b.id);
    if (error) {
      toast.error("Não foi possível atualizar");
      return;
    }
    invalidar();
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-primary">Banners do topo</h2>
          <p className="text-xs text-muted-foreground">
            Até {LIMITE} imagens · tamanho recomendado 1600 × 900 px (16:9), JPG até 500 KB
          </p>
        </div>
        <Button
          variant="gold"
          disabled={lista.length >= LIMITE}
          onClick={() => setForm({ ...vazio, ordem: String(lista.length + 1) })}
        >
          <Plus className="h-4 w-4" /> Banner
        </Button>
      </div>

      {lista.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">
          Nenhum banner cadastrado. O banner de texto padrão continua sendo exibido.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
          {lista.map((b) => (
            <li key={b.id} className="flex items-center gap-3 bg-card p-3">
              <img
                src={b.imagem_url}
                alt={b.alt ?? "Banner"}
                className="h-14 w-24 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-primary">{b.alt || "Sem descrição"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Ordem {b.ordem}
                  {b.link ? ` · ${b.link}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch checked={b.ativo} onCheckedChange={() => alternar(b)} aria-label="Ativo" />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Editar"
                  onClick={() =>
                    setForm({
                      id: b.id,
                      alt: b.alt ?? "",
                      link: b.link ?? "",
                      ordem: String(b.ordem),
                      ativo: b.ativo,
                      imagem_url: b.imagem_url,
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remover"
                  onClick={() => remover(b)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FormularioBanner
        form={form}
        onFechar={() => setForm(null)}
        onSalvo={() => {
          setForm(null);
          invalidar();
        }}
      />
    </section>
  );
}

function FormularioBanner({
  form,
  onFechar,
  onSalvo,
}: {
  form: FormBanner | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [dados, setDados] = useState<FormBanner>(vazio);
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
    if (!arquivo && !dados.imagem_url) {
      toast.error("Selecione uma imagem");
      return;
    }
    setSalvando(true);
    try {
      let imagem_url = dados.imagem_url;

      if (arquivo) {
        const ext = arquivo.name.split(".").pop() ?? "jpg";
        const caminho = `banners/${crypto.randomUUID()}.${ext}`;
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
        imagem_url: imagem_url!,
        alt: dados.alt.trim() || null,
        link: dados.link.trim() || null,
        ordem: Number(dados.ordem) || 0,
        ativo: dados.ativo,
      };

      const resposta = dados.id
        ? await supabase.from("banners").update(payload).eq("id", dados.id)
        : await supabase.from("banners").insert(payload);
      if (resposta.error) throw resposta.error;

      toast.success(dados.id ? "Banner atualizado" : "Banner adicionado");
      onSalvo();
    } catch {
      toast.error("Não foi possível salvar o banner");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={!!form} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold text-primary">
            {dados.id ? "Editar banner" : "Novo banner"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-img">Imagem (1600 × 900 px)</Label>
            <Input
              id="b-img"
              type="file"
              accept="image/*"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
            {dados.imagem_url && !arquivo && (
              <img
                src={dados.imagem_url}
                alt="Banner atual"
                className="mt-2 h-24 w-full rounded-md object-cover"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-alt">Descrição da imagem</Label>
            <Input
              id="b-alt"
              value={dados.alt}
              maxLength={120}
              onChange={(e) => setDados({ ...dados, alt: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-link">Link (opcional)</Label>
              <Input
                id="b-link"
                value={dados.link}
                placeholder="https://"
                onChange={(e) => setDados({ ...dados, link: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-ordem">Ordem</Label>
              <Input
                id="b-ordem"
                inputMode="numeric"
                value={dados.ordem}
                onChange={(e) => setDados({ ...dados, ordem: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="b-ativo">Exibir na loja</Label>
            <Switch
              id="b-ativo"
              checked={dados.ativo}
              onCheckedChange={(v) => setDados({ ...dados, ativo: v })}
            />
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar banner"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
