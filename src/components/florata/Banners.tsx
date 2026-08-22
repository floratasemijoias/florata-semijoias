import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";

export type Banner = {
  id: string;
  imagem_url: string;
  alt: string | null;
  link: string | null;
  ordem: number;
  ativo: boolean;
};

function HeroTexto() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-accent/25 px-4 py-10 text-center sm:py-14">
      <div className="mx-auto max-w-xl">
        <p className="text-[10px] tracking-brand text-muted-foreground uppercase">
          Semijoias selecionadas
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight font-semibold text-primary sm:text-5xl">
          Peças que <span className="text-gold-gradient">brilham</span> com você
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Escolha suas favoritas, monte a sacola e finalize o pedido pelo WhatsApp. Entrega combinada
          com todo cuidado.
        </p>
      </div>
    </div>
  );
}

export function Banners() {
  const [api, setApi] = useState<CarouselApi>();
  const [atual, setAtual] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const slides = banners ?? [];
  const total = slides.length + 1;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setAtual(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || total < 2) return;
    const id = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [api, total]);

  return (
    <section className="border-b border-border">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent className="ml-0">
          <CarouselItem className="pl-0">
            <div className="min-h-[260px] sm:min-h-[340px]">
              <HeroTexto />
            </div>
          </CarouselItem>
          {slides.map((b) => {
            const img = (
              <img
                src={b.imagem_url}
                alt={b.alt ?? "Banner Florata"}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            );
            return (
              <CarouselItem key={b.id} className="pl-0">
                <div className="min-h-[260px] bg-accent/25 sm:min-h-[340px]">
                  <div className="h-[260px] sm:h-[340px]">
                    {b.link ? (
                      <a
                        href={b.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full w-full"
                      >
                        {img}
                      </a>
                    ) : (
                      img
                    )}
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {total > 1 && (
        <div className="flex justify-center gap-1.5 bg-accent/25 pb-3">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o banner ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                i === atual ? "w-6 bg-gold-gradient" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
