import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gtmIdValido, iniciarDataLayer, injetarGTM, trackPageView } from "@/lib/gtm";

/** Carrega o container do GTM configurado no painel admin e rastreia mudanças de rota. */
export function GtmLoader() {
  const caminho = useRouterState({ select: (s) => s.location.pathname });

  const { data: gtmId } = useQuery({
    queryKey: ["gtm-container-id"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("gtm_container_id")
        .maybeSingle();
      if (error) return null;
      return data?.gtm_container_id ?? null;
    },
  });

  useEffect(() => {
    iniciarDataLayer();
  }, []);

  useEffect(() => {
    if (gtmIdValido(gtmId)) injetarGTM(gtmId!);
  }, [gtmId]);

  useEffect(() => {
    if (!gtmIdValido(gtmId)) return;
    trackPageView(caminho, typeof document !== "undefined" ? document.title : "");
  }, [caminho, gtmId]);

  return null;
}
