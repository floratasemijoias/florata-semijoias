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
  const total = slides.length;

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

  if (total === 0) return null;

  return (
    <section className="border-b border-border">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent className="ml-0">
          {slides.map((b, index) => {
            const img = (
              <img
                src={b.imagem_url}
                alt={b.alt ?? "Banner Florata"}
                width={1600}
                height={900}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding="async"
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
