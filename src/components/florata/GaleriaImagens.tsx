import { useRef, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { comprimirImagemProduto } from "@/lib/comprimir-imagem";

export type ItemGaleria =
  | { status: "existente"; url: string }
  | { status: "novo"; file: File; preview: string };

// Limite do plano Supabase Free por arquivo.
const TAMANHO_MAXIMO = 50 * 1024 * 1024;

export function GaleriaImagens({
  itens,
  onChange,
}: {
  itens: ItemGaleria[];
  onChange: (itens: ItemGaleria[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  async function adicionarArquivos(arquivos: FileList | File[]) {
    const novos: ItemGaleria[] = [];
    for (const file of Array.from(arquivos)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" não é uma imagem`);
        continue;
      }
      if (file.size > TAMANHO_MAXIMO) {
        toast.error(`"${file.name}" passa de 50MB e não foi adicionada`);
        continue;
      }
      try {
        const comprimida = await comprimirImagemProduto(file);
        novos.push({
          status: "novo",
          file: comprimida,
          preview: URL.createObjectURL(comprimida),
        });
      } catch {
        toast.error(`Não foi possível preparar "${file.name}"`);
      }
    }
    if (novos.length) onChange([...itens, ...novos]);
  }

  function remover(idx: number) {
    const item = itens[idx];
    if (!item) return;
    if (item.status === "novo") URL.revokeObjectURL(item.preview);
    onChange(itens.filter((_, i) => i !== idx));
  }

  function tornarCapa(idx: number) {
    if (idx === 0) return;
    const copia = [...itens];
    const [item] = copia.splice(idx, 1);
    if (!item) return;
    copia.unshift(item);
    onChange(copia);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {itens.map((item, idx) => {
          const src = item.status === "existente" ? item.url : item.preview;
          return (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-accent/40"
            >
              <img
                src={src}
                alt=""
                width={200}
                height={200}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {idx === 0 ? (
                <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                  <Star className="h-2.5 w-2.5 fill-current" /> Capa
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => tornarCapa(idx)}
                  className="absolute top-1 left-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  Tornar capa
                </button>
              )}
              <button
                type="button"
                aria-label="Remover imagem"
                onClick={() => remover(idx)}
                className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        <div
          role="button"
          tabIndex={0}
          aria-label="Adicionar fotos"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            if (e.dataTransfer.files?.length) void adicionarArquivos(e.dataTransfer.files);
          }}
          className={`grid aspect-square cursor-pointer place-items-center rounded-md border border-dashed transition-colors ${
            arrastando ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) void adicionarArquivos(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      <p className="text-[11px] text-muted-foreground">
        Clique ou arraste para adicionar fotos. Elas são reduzidas para até 1000 px e convertidas
        automaticamente para WebP. A primeira é a capa exibida no catálogo.
      </p>
    </div>
  );
}
