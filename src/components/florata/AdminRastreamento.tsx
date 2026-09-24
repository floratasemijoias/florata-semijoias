import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { gtmIdValido } from "@/lib/gtm";

export function AdminRastreamento() {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [destravado, setDestravado] = useState(false);

  const { data } = useQuery({
    queryKey: ["settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("gtm_container_id")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setValor(data.gtm_container_id ?? "");
  }, [data]);

  async function salvar() {
    const limpo = valor.trim().toUpperCase();
    if (limpo && !gtmIdValido(limpo)) {
      toast.error("ID inválido. Use o formato GTM-XXXXXXX");
      return;
    }
    if (
      !confirm(
        "Tem certeza que quer alterar o Container ID do GTM? Isso muda o rastreamento de todo o site (pixel, Google Ads, eventos).",
      )
    ) {
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from("settings")
      .upsert({ id: true, gtm_container_id: limpo || null, atualizado_em: new Date().toISOString() });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar o ID do GTM");
      return;
    }
    setValor(limpo);
    setDestravado(false);
    toast.success(limpo ? "Rastreamento atualizado" : "Rastreamento desativado");
    queryClient.invalidateQueries({ queryKey: ["settings-admin"] });
    queryClient.invalidateQueries({ queryKey: ["gtm-container-id"] });
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="font-display text-lg font-semibold text-primary">Rastreamento</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Informe o container do Google Tag Manager. Deixe vazio para não carregar nenhum script de
        rastreamento.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="gtm">Google Tag Manager Container ID</Label>
          <Input
            id="gtm"
            value={valor}
            disabled={!destravado}
            onChange={(e) => setValor(e.target.value)}
            placeholder="GTM-XXXXXXX"
          />
        </div>
        {destravado ? (
          <Button variant="gold" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setDestravado(true)}
          >
            <Lock className="h-4 w-4" /> Destravar edição
          </Button>
        )}
      </div>

      {destravado && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Unlock className="h-3 w-3" /> Campo destravado — cuidado, essa alteração afeta o
          rastreamento de todo o site.
        </p>
      )}

      <p className="mt-4 rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
        Eventos enviados ao dataLayer: <strong>page_view</strong>, <strong>view_item</strong>,{" "}
        <strong>add_to_cart</strong>, <strong>remove_from_cart</strong>, <strong>view_cart</strong>,{" "}
        <strong>begin_checkout</strong> e <strong>pedido_enviado</strong>. Use{" "}
        <strong>pedido_enviado</strong> como evento de conversão no GTM (Google Ads e evento
        personalizado do Meta Pixel), pois o pagamento acontece fora do site.
      </p>
    </section>
  );
}

