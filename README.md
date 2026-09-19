# Florata Shop

Crie uma landing page em português (pt-BR), mobile-first e responsiva, para a marca Florata, funcionando como um catálogo online com carrinho e finalização de pedido via WhatsApp (sem gateway de pagamento).

Identidade visual

Cor primária: #2F3C32

Branco puro (#FFFFFF) como base

Gradiente dourado de destaque (usar em botões principais, badges, detalhes): de #CCAC5C para #FCFACF

Tipografia elegante, limpa, com bom espaçamento (estilo boutique/floricultura premium)

Vou subir a logo depois — deixe um placeholder de logo no header

Banco de dados (Supabase)

Conecte o projeto ao Supabase (usar integração nativa do Lovable) e crie a tabela produtos com os campos:

id

nome (texto)

categoria (texto)

tamanho (texto, ex: P, M, G ou dimensão)

preco (numérico)

estoque (booleano "disponível" + quantidade opcional)

descricao (texto, opcional)

imagem_url (texto — armazenada no Supabase Storage)

criado_em (timestamp)

Crie também um bucket no Supabase Storage para as imagens dos produtos.

Painel administrativo

Crie uma rota /admin, protegida por login simples (email/senha via Supabase Auth, um único usuário administrador), onde eu possa:

Ver todos os produtos em uma lista/tabela

Cadastrar novo produto (nome, categoria, tamanho, preço, upload de foto, disponibilidade)

Editar produto existente

Remover produto

Marcar produto como "esgotado" sem precisar excluir

Página principal (catálogo)

Header com logo (placeholder), nome "Florata" e botão de carrinho (ver seção Sacola)

Grade de produtos (cards com foto, nome, preço, tamanho) puxados do Supabase

Filtro por categoria (as categorias devem ser geradas dinamicamente a partir dos produtos cadastrados, tipo abas ou chips)

Dentro de cada categoria, filtros adicionais por:

Tamanho (múltipla escolha)

Faixa de preço (slider ou min/max)

Produtos esgotados aparecem com indicação visual de "esgotado" e não podem ser adicionados ao carrinho

Página/modal de detalhe do produto

Ao clicar em um produto, abrir visualização ampliada (modal ou página) com:

Foto em destaque (maior)

Nome, categoria, tamanho, preço, descrição

Seletor de quantidade

Botão "Adicionar à sacola"

Sacola (carrinho)

Barra/ícone fixo na parte inferior da tela, visível somente depois que pelo menos 1 item for adicionado

Mostra ícone de sacola + contador de itens

Ao clicar em "Ver carrinho": abre lista dos itens adicionados, permitindo:

Alterar quantidade de cada item

Remover item da sacola

Rodapé da sacola mostra o valor total calculado e um botão "Continuar"

Checkout (sem gateway de pagamento)

Ao clicar em "Continuar", abrir uma janela/etapa de checkout solicitando:

Nome completo

WhatsApp (com máscara de telefone)

Endereço completo (rua, número, bairro, complemento, referência)

Forma de pagamento (seleção única): Pix / Cartão de crédito / Cartão de débito / Dinheiro

Se "Cartão de crédito" for selecionado, exibir campo adicional de número de parcelas (opções: 1x, 2x, 3x)

Bloco com a chave Pix: 51997897864 e um botão "Copiar chave Pix" (copiar para a área de transferência com feedback visual de "copiado")

Agendamento de entrega (na mesma tela de checkout)

Seção para escolher dia e horário sugerido de entrega, a partir de horários disponíveis (pode ser um seletor de data + blocos de horário, ex: manhã/tarde ou horários fixos configuráveis)

Texto de aviso visível: "Este é um horário sugerido. A confirmação do dia e horário de entrega será feita por WhatsApp, de acordo com a disponibilidade."

Envio do pedido

Botão final "Enviar Pedido pelo WhatsApp"

Ao clicar, montar automaticamente uma mensagem de texto formatada com: lista de produtos (nome, tamanho, quantidade, preço unitário), valor total, nome do cliente, WhatsApp, endereço, forma de pagamento (e parcelas se cartão de crédito), data/horário sugerido de entrega

Abrir o WhatsApp (wa.me) com essa mensagem pré-preenchida, direcionando para o número +5551997897864

Não implementar nenhum gateway de pagamento (Stripe, Mercado Pago, etc.) — o pedido é só confirmado manualmente pelo WhatsApp

Botão flutuante do WhatsApp

Botão fixo no canto inferior direito, com o ícone do WhatsApp, visível em todas as páginas

Ao clicar, abre uma conversa direta no WhatsApp com o número +5551997897864 (sem produtos anexados, apenas para contato geral)

Referência de estilo

Use como referência de organização/fluxo (não copiar conteúdo) o site: https://docantocafeteria.com/

Observações técnicas finais

Priorize performance e um layout limpo, com boa experiência em celular (a maioria dos acessos será mobile)

Todos os textos da interface em português do Brasil

Valores sempre formatados em Real (R$ 0,00)

Não crie páginas ou funcionalidades além das descritas acima

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://florata-semijoias.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f2141db-79e2-4288-b02e-14bd64c48083).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
