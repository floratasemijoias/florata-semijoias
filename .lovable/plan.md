# Otimização de performance mobile

## O que será alterado
- Converter e redimensionar imagens no momento do upload: produtos em WebP dentro do tamanho real necessário e banners em WebP adequado ao topo.
- Reservar espaço de todas as imagens com dimensões explícitas e aplicar carregamento tardio somente ao conteúdo fora da primeira tela.
- Priorizar apenas o primeiro banner, que é o LCP, e manter os demais banners e produtos com carregamento econômico.
- Tornar as fontes externas não bloqueantes, preservando as mesmas famílias e aparência.
- Adiar módulos administrativos e de rastreamento que não são necessários para a primeira exibição, quando isso não mudar o comportamento.
- Configurar cache longo somente para arquivos estáticos versionados e imagens, mantendo páginas e dados atualizáveis.

## Imagens já cadastradas
- Converter também as imagens existentes, atualizando seus endereços no catálogo sem alterar produtos, textos ou ordem visual.
- Manter compatibilidade com imagens antigas caso alguma conversão individual não seja possível.

## Validação
- Conferir a página inicial em tela mobile e desktop, garantindo ausência de mudanças visuais e de deslocamentos.
- Verificar carregamento, prioridade do primeiro banner, lazy loading, fontes e cabeçalhos de cache.

## Detalhes técnicos
- Conversão no navegador antes do envio, sem biblioteca pesada na página pública.
- `srcset` será usado somente onde houver variantes reais; não serão declaradas variantes falsas do mesmo arquivo.
- O primeiro banner usará prioridade alta e carregamento imediato; imagens seguintes usarão prioridade baixa e lazy loading.
