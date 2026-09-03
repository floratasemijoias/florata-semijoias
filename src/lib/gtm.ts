// Utilitário modular de Google Tag Manager.
// Toda a lógica é "best effort": nenhuma falha aqui pode quebrar o fluxo do site.

export type GtmItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
};

const MOEDA = "BRL";

export function gtmIdValido(id: string | null | undefined): boolean {
  return !!id && /^GTM-[A-Z0-9]{4,}$/i.test(id.trim());
}

function debug(...args: unknown[]) {
  try {
    if (typeof window !== "undefined" && localStorage.getItem("debug_gtm") === "true") {
      console.log("[gtm]", ...args);
    }
  } catch {
    /* ignora */
  }
}

export function iniciarDataLayer() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
}

/** Injeta o script do GTM no <head> e o <noscript> no início do <body>. */
export function injetarGTM(containerId: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!gtmIdValido(containerId)) return;
  const id = containerId.trim().toUpperCase();
  if (document.getElementById("gtm-script")) return;

  try {
    iniciarDataLayer();
    window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });

    const script = document.createElement("script");
    script.id = "gtm-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    script.onerror = () => debug("falha ao carregar o script do GTM");
    document.head.appendChild(script);

    const noscript = document.createElement("noscript");
    noscript.id = "gtm-noscript";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    debug("GTM injetado", id);
  } catch (e) {
    debug("erro ao injetar GTM", e);
  }
}

/** Push genérico com limpeza do objeto ecommerce anterior (recomendação GA4). */
export function pushEvento(evento: string, dados: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    iniciarDataLayer();
    if ("ecommerce" in dados) window.dataLayer!.push({ ecommerce: null });
    window.dataLayer!.push({ event: evento, ...dados });
    debug(evento, dados);
  } catch (e) {
    debug("erro no push", e);
  }
}

export function trackPageView(path: string, title: string) {
  pushEvento("page_view", { page_path: path, page_title: title });
}

export function trackViewItem(item: GtmItem) {
  pushEvento("view_item", {
    ecommerce: { currency: MOEDA, value: item.price, items: [item] },
  });
}

export function trackAddToCart(item: GtmItem) {
  pushEvento("add_to_cart", {
    ecommerce: {
      currency: MOEDA,
      value: item.price * (item.quantity ?? 1),
      items: [item],
    },
  });
}

export function trackRemoveFromCart(item: GtmItem) {
  pushEvento("remove_from_cart", {
    ecommerce: {
      currency: MOEDA,
      value: item.price * (item.quantity ?? 1),
      items: [item],
    },
  });
}

export function trackViewCart(items: GtmItem[], valor: number) {
  pushEvento("view_cart", { ecommerce: { currency: MOEDA, value: valor, items } });
}

export function trackBeginCheckout(items: GtmItem[], valor: number) {
  pushEvento("begin_checkout", { ecommerce: { currency: MOEDA, value: valor, items } });
}

/**
 * Evento de CONVERSÃO principal da loja (não há pagamento no site).
 * Use "pedido_enviado" no GTM para configurar a conversão do Google Ads
 * e o evento personalizado do Meta Pixel.
 */
export function trackPedidoEnviado(items: GtmItem[], valor: number) {
  pushEvento("pedido_enviado", {
    ecommerce: { currency: MOEDA, value: valor, items, num_items: items.length },
  });
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
