const TAMANHO_MAXIMO_PX = 1000;
const QUALIDADE_WEBP = 0.8;

export async function comprimirImagemProduto(arquivo: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  const comprimida = await imageCompression(arquivo, {
    maxWidthOrHeight: TAMANHO_MAXIMO_PX,
    initialQuality: QUALIDADE_WEBP,
    fileType: "image/webp",
    useWebWorker: true,
  });

  const nomeBase = arquivo.name.replace(/\.[^.]+$/, "") || "produto";
  return new File([comprimida], `${nomeBase}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}