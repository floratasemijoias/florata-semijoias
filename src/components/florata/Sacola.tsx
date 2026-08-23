import { useState } from "react";
import { Check, Copy, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSacola } from "@/lib/carrinho";
import {
  BLOCOS_HORARIO,
  PIX_CHAVE,
  formatarData,
  formatarPreco,
  linkWhatsApp,
  mascaraTelefone,
} from "@/lib/florata";

type Pagamento = "Pix" | "Cartão de crédito" | "Cartão de débito" | "Dinheiro";

export function BarraSacola({ onAbrir }: { onAbrir: () => void }) {
  const { totalItens, totalValor } = useSacola();
  if (totalItens === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/60 text-primary">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-gradient px-1 text-[11px] font-semibold text-gold-foreground">
              {totalItens}
            </span>
          </span>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {totalItens} {totalItens === 1 ? "item" : "itens"} na sacola
            </p>
            <p className="text-sm font-medium text-primary">{formatarPreco(totalValor)}</p>
          </div>
        </div>
        <Button variant="gold" onClick={onAbrir} className="w-full max-w-xs">
          Ver carrinho
        </Button>
      </div>
    </div>
  );
}

export function SacolaSheet({
  aberta,
  onOpenChange,
}: {
  aberta: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { itens, totalValor, definirQuantidade, remover, limpar } = useSacola();
  const [etapa, setEtapa] = useState<"itens" | "checkout">("itens");
  const [copiado, setCopiado] = useState(false);

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [pagamento, setPagamento] = useState<Pagamento>("Pix");
  const [parcelas, setParcelas] = useState("1x");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState<string>(BLOCOS_HORARIO[0] ?? "");

  const hoje = new Date().toISOString().slice(0, 10);

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(PIX_CHAVE);
      setCopiado(true);
      toast.success("Chave Pix copiada");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Chave: " + PIX_CHAVE);
    }
  }

  function enviarPedido() {
    if (!nome.trim() || whatsapp.replace(/\D/g, "").length < 10) {
      toast.error("Informe nome completo e WhatsApp válido");
      return;
    }
    if (!rua.trim() || !numero.trim() || !bairro.trim()) {
      toast.error("Informe rua, número e bairro");
      return;
    }
    if (!data) {
      toast.error("Escolha o dia sugerido de entrega");
      return;
    }

    const linhas = itens.map(
      (i) =>
        `• ${i.nome}${i.tamanho ? ` (${i.tamanho})` : ""} — ${i.quantidade}x ${formatarPreco(i.preco)}`,
    );

    const mensagem = [
      "*Novo pedido Florata*",
      "",
      "*Produtos:*",
      ...linhas,
      "",
      `*Total:* ${formatarPreco(totalValor)}`,
      "",
      `*Cliente:* ${nome.trim()}`,
      `*WhatsApp:* ${whatsapp}`,
      `*Endereço:* ${rua.trim()}, ${numero.trim()} — ${bairro.trim()}${
        complemento.trim() ? ` — ${complemento.trim()}` : ""
      }${referencia.trim() ? ` (ref.: ${referencia.trim()})` : ""}`,
      `*Forma de pagamento:* ${pagamento}${pagamento === "Cartão de crédito" ? ` — ${parcelas}` : ""}`,
      `*Entrega sugerida:* ${formatarData(data)} — ${horario}`,
      "",
      "Horário sugerido, a confirmar pelo WhatsApp.",
    ].join("\n");

    window.open(linkWhatsApp(mensagem), "_blank", "noopener,noreferrer");
    limpar();
    onOpenChange(false);
    setEtapa("itens");
  }

  return (
    <Sheet
      open={aberta}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setEtapa("itens");
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button]:cursor-pointer"
      >
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle className="font-display text-xl font-semibold text-primary">
            {etapa === "itens" ? "Sua sacola" : "Finalizar pedido"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {etapa === "itens" ? (
            itens.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sua sacola está vazia.
              </p>
            ) : (
              <ul className="space-y-4">
                {itens.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-accent/40">
                      {item.imagem_url && (
                        <img
                          src={item.imagem_url}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">{item.nome}</p>
                      {item.tamanho && (
                        <p className="text-xs text-muted-foreground">Tamanho: {item.tamanho}</p>
                      )}
                      <p className="text-sm text-primary">{formatarPreco(item.preco)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            aria-label="Diminuir"
                            onClick={() => definirQuantidade(item.id, item.quantidade - 1)}
                            className="grid h-8 w-8 cursor-pointer place-items-center text-primary"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm">{item.quantidade}</span>
                          <button
                            type="button"
                            aria-label="Aumentar"
                            onClick={() => definirQuantidade(item.id, item.quantidade + 1)}
                            className="grid h-8 w-8 cursor-pointer place-items-center text-primary"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remover(item.id)}
                          aria-label="Remover item"
                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    maxLength={100}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whats">WhatsApp</Label>
                  <Input
                    id="whats"
                    inputMode="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(mascaraTelefone(e.target.value))}
                    placeholder="(51) 99999-9999"
                  />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rua">Rua</Label>
                    <Input id="rua" value={rua} onChange={(e) => setRua(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="num">Número</Label>
                    <Input id="num" value={numero} onChange={(e) => setNumero(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="compl">Complemento</Label>
                  <Input
                    id="compl"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Apto, bloco (opcional)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ref">Ponto de referência</Label>
                  <Input
                    id="ref"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <RadioGroup
                  value={pagamento}
                  onValueChange={(v) => setPagamento(v as Pagamento)}
                  className="grid grid-cols-2 gap-2"
                >
                  {(["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"] as const).map(
                    (opcao) => (
                      <Label
                        key={opcao}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-sm has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-accent/60"
                      >
                        <RadioGroupItem value={opcao} />
                        {opcao}
                      </Label>
                    ),
                  )}
                </RadioGroup>

                {pagamento === "Cartão de crédito" && (
                  <div className="space-y-2 pt-1">
                    <Label>Parcelas</Label>
                    <RadioGroup
                      value={parcelas}
                      onValueChange={setParcelas}
                      className="flex gap-2"
                    >
                      {["1x", "2x", "3x"].map((p) => (
                        <Label
                          key={p}
                          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border p-2 text-sm has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-accent/60"
                        >
                          <RadioGroupItem value={p} />
                          {p}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gold/50 bg-accent/40 p-3">
                <p className="text-xs tracking-brand text-muted-foreground uppercase">Chave Pix</p>
                <p className="mt-1 font-medium text-primary">{PIX_CHAVE}</p>
                <Button
                  type="button"
                  variant={copiado ? "default" : "goldOutline"}
                  size="sm"
                  className="mt-2 w-full"
                  onClick={copiarPix}
                >
                  {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiado ? "Copiado!" : "Copiar chave Pix"}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="data">Dia sugerido de entrega</Label>
                  <Input
                    id="data"
                    type="date"
                    min={hoje}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário sugerido</Label>
                  <RadioGroup value={horario} onValueChange={setHorario} className="space-y-2">
                    {BLOCOS_HORARIO.map((bloco) => (
                      <Label
                        key={bloco}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-sm has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-accent/60"
                      >
                        <RadioGroupItem value={bloco} />
                        {bloco}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <p className="rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                  Este é um horário sugerido. A confirmação do dia e horário de entrega será feita
                  por WhatsApp, de acordo com a disponibilidade.
                </p>
              </div>
            </div>
          )}
        </div>

        {itens.length > 0 && (
          <div className="space-y-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-medium text-primary">{formatarPreco(totalValor)}</span>
            </div>
            {etapa === "itens" ? (
              <Button variant="gold" size="lg" className="w-full" onClick={() => setEtapa("checkout")}>
                Continuar
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="gold" size="lg" className="w-full" onClick={enviarPedido}>
                  Enviar Pedido pelo WhatsApp
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setEtapa("itens")}>
                  Voltar para a sacola
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
