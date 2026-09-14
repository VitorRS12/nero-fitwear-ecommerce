# FitStyle Studio

PLANEJAMENTO COMPLETO — E-COMMERCE DE ROUPAS FITNESS

Quero iniciar o planejamento e a estruturação de um novo projeto de e-commerce para uma marca de roupas fitness.

IMPORTANTE: este primeiro momento é EXCLUSIVAMENTE de planejamento, análise e definição da arquitetura do projeto. NÃO comece implementando todas as funcionalidades ainda.

A marca já possui sua identidade visual definida. Já tenho:

Logo oficial

Nome da marca

Identidade visual

Elementos gráficos

Fundos preparados

Referências visuais

Materiais de branding

Esses materiais devem ser tratados como a fonte principal da identidade visual do projeto. Não invente uma nova identidade para a marca e não substitua os elementos existentes por alternativas genéricas.

1. OBJETIVO DO PROJETO

O objetivo é desenvolver uma loja virtual profissional para venda de roupas fitness.

O site deverá funcionar como um e-commerce completo, permitindo que o cliente:

Navegue pelos produtos

Filtre produtos

Visualize detalhes dos produtos

Selecione tamanho

Selecione cor/variação

Adicione produtos ao carrinho

Altere quantidades

Visualize o resumo da compra

Informe seus dados

Informe endereço de entrega

Escolha o método de pagamento

Realize o pagamento

Receba confirmação do pedido

Acompanhe o status do pedido

Além disso, o proprietário da loja deverá possuir uma área administrativa para:

Cadastrar produtos

Editar produtos

Controlar estoque

Gerenciar categorias

Gerenciar variações

Visualizar pedidos

Alterar status dos pedidos

Acompanhar pagamentos

Visualizar informações relevantes das vendas

2. STACK E PRINCÍPIOS TÉCNICOS

O projeto deverá ser planejado considerando:

React

TypeScript

Tailwind CSS

React Bricks

Componentização

Arquitetura modular

Componentes reutilizáveis

Responsividade

Mobile-first

Boas práticas de acessibilidade

Código limpo

Separação entre UI, lógica e serviços

Utilize TypeScript de forma consistente.

Evite utilizar any sem necessidade.

A arquitetura deve permitir crescimento futuro da aplicação.

3. REACT BRICKS

Quero utilizar React Bricks como parte importante da arquitetura visual e de componentes do projeto.

Planeje os componentes pensando em blocos reutilizáveis e configuráveis.

A arquitetura deve permitir que elementos visuais possam ser reutilizados em diferentes partes do site sem duplicação desnecessária de código.

Exemplos de componentes/blocos que devem ser considerados:

Hero

Banner

ProductCard

ProductGrid

CategoryCard

ProductCarousel

PromotionalBanner

Section

CTA

Header

Footer

Newsletter

FeatureSection

Testimonials

ProductHighlight

AnnouncementBar

Não crie componentes gigantes.

Cada componente deve possuir uma responsabilidade clara.

4. IDENTIDADE VISUAL

Antes de definir qualquer interface, analise os materiais visuais já existentes no projeto.

Considere:

Logo

Cores

Tipografia

Fundos

Elementos gráficos

Espaçamentos

Estilo fotográfico

Estilo dos banners

Estilo dos botões

Linguagem visual

Crie uma estratégia de Design System baseada na identidade existente.

Não substitua a identidade visual por:

Gradientes genéricos

Cores aleatórias

Fontes aleatórias

Componentes visualmente genéricos

Layouts padrão de templates de e-commerce

A interface deve transmitir uma marca fitness moderna, premium, forte e profissional, mas sempre respeitando os materiais já fornecidos.

5. ESTRUTURA PRINCIPAL DO SITE

Planeje inicialmente as seguintes páginas:

Home

Possíveis seções:

Header

Announcement Bar

Hero principal

Categorias

Produtos em destaque

Novidades

Mais vendidos

Banner promocional

Benefícios da marca

Depoimentos

Instagram/redes sociais

Newsletter

Footer

A estrutura final deve ser definida após analisar a identidade visual.

Catálogo

Página responsável pela apresentação dos produtos.

Deve possuir:

Categorias

Filtros

Ordenação

Busca

Grid de produtos

Paginação ou carregamento progressivo

Indicador de estoque quando necessário

Filtros possíveis:

Categoria

Tamanho

Cor

Faixa de preço

Disponibilidade

Coleção

Página do produto

Deve apresentar:

Galeria de imagens

Nome

Preço

Preço promocional

Descrição

Tamanhos

Cores

Disponibilidade

Quantidade

Botão adicionar ao carrinho

Informações de entrega

Informações sobre troca/devolução

Produtos relacionados

A seleção de tamanho e cor deve ser obrigatória quando o produto possuir essas variações.

6. PRODUTOS E VARIAÇÕES

O sistema NÃO deve considerar estoque apenas no nível do produto.

Devemos trabalhar com variações.

Exemplo:

Produto:

"Legging Performance"

Variações:

Preta / P

Preta / M

Preta / G

Azul / P

Azul / M

Azul / G

Cada combinação deverá possuir seu próprio estoque.

Planeje uma estrutura que permita:

SKU

Cor

Tamanho

Estoque

Preço

Imagens específicas da variação, se necessário

Status de disponibilidade

7. CARRINHO

O carrinho deverá permitir:

Adicionar produtos

Remover produtos

Alterar quantidade

Visualizar variação selecionada

Visualizar subtotal

Calcular frete

Aplicar cupom

Visualizar desconto

Visualizar total

Continuar comprando

Ir para checkout

O carrinho deve preservar os produtos durante a navegação.

8. CHECKOUT

Planeje um checkout simples e objetivo.

Informações:

Cliente

Nome

E-mail

Telefone

Endereço

CEP

Estado

Cidade

Bairro

Rua

Número

Complemento

Entrega

Método de envio

Prazo

Valor do frete

Pagamento

O sistema deverá ser preparado para integração com um gateway de pagamento.

Considerar inicialmente:

PIX

Cartão de crédito

Outros métodos suportados pelo gateway escolhido

NÃO implementar um sistema próprio de processamento de cartão.

O processamento deverá ser realizado por um gateway especializado.

9. PAGAMENTO

A arquitetura deverá permitir integração com um gateway de pagamento.

O gateway deve ser desacoplado da interface.

Crie uma camada de serviço específica para pagamentos.

Exemplo conceitual:

paymentService

Responsabilidades:

Criar pagamento

Criar preferência/checkout

Consultar pagamento

Processar retorno

Processar webhook

Atualizar status do pagamento

O sistema deve considerar estados como:

pending

approved

rejected

cancelled

refunded

O pagamento NÃO deve ser considerado aprovado apenas porque o usuário retornou para o site.

A confirmação deverá utilizar a resposta oficial do gateway/webhook.

10. PEDIDOS

Após a confirmação do pedido, o sistema deverá criar um registro de pedido.

Um pedido deverá possuir:

Número do pedido

Cliente

Produtos

Variações

Quantidades

Valores

Desconto

Frete

Total

Endereço

Método de pagamento

Status do pagamento

Status do pedido

Data

Histórico de alterações

Planejar os seguintes status:

Aguardando pagamento

Pagamento aprovado

Em preparação

Enviado

Entregue

Cancelado

O sistema deve manter histórico das alterações de status.

11. ESTOQUE

O estoque deve ser atualizado de maneira segura.

É necessário evitar situações como:

Cliente A compra a última unidade enquanto Cliente B também tenta comprar a mesma unidade.

Planeje mecanismos para:

Controle de estoque

Reserva de estoque

Baixa de estoque

Cancelamento

Estorno

Reposição

A implementação definitiva dessa lógica deverá ser feita posteriormente.

12. PAINEL ADMINISTRATIVO

Criar planejamento para uma área administrativa separada.

Estrutura inicial:

Dashboard

Vendas

Pedidos

Produtos

Estoque

Categorias

Cupons

Clientes

Configurações

Dashboard deve futuramente apresentar:

Vendas do período

Quantidade de pedidos

Ticket médio

Produtos mais vendidos

Produtos com estoque baixo

Pedidos recentes

Status dos pedidos

13. GERENCIAMENTO DE PRODUTOS

O administrador deverá conseguir:

Criar produto

Editar produto

Excluir/desativar produto

Adicionar imagens

Criar variações

Definir tamanhos

Definir cores

Definir preços

Definir estoque

Definir SKU

Definir categoria

Definir produto em destaque

Definir produto em promoção

Planejar também suporte futuro para:

Coleções

Tags

Produtos relacionados

14. NOTIFICAÇÕES

Planejar sistema de notificações.

Cliente:

Pedido criado

Pagamento aprovado

Pedido em preparação

Pedido enviado

Pedido entregue

Administrador:

Novo pedido

Pagamento aprovado

Falha no pagamento

Estoque baixo

A implementação pode utilizar e-mail transacional posteriormente.

15. SEGURANÇA

Planejar desde o início:

Autenticação administrativa

Autorização por função

Proteção das rotas administrativas

Validação de dados

Sanitização

Proteção das APIs

Variáveis de ambiente

Nunca expor chaves privadas no frontend

Webhooks protegidos

Controle de acesso ao banco

Informações sensíveis nunca devem ser armazenadas no código.

16. SEO

Planejar:

URLs amigáveis

Meta title

Meta description

Open Graph

Sitemap

Robots.txt

Dados estruturados para produtos

URLs de produtos otimizadas

Canonical URLs

O e-commerce deve ser preparado para indexação no Google.

17. PERFORMANCE

Planejar:

Otimização de imagens

Lazy loading

Carregamento progressivo

Code splitting quando necessário

Minimização de JavaScript desnecessário

Otimização de fontes

Cache

Performance mobile

O site deve priorizar experiência rápida principalmente em dispositivos móveis.

18. RESPONSIVIDADE

O projeto deve ser desenvolvido mobile-first.

Considerar principalmente:

Smartphones

Tablets

Notebooks

Monitores grandes

A experiência mobile deve ser tratada como prioridade, não como adaptação posterior.

19. ARQUITETURA DE COMPONENTES

Planejar uma arquitetura semelhante a:

components/
├── ui/
├── layout/
├── home/
├── product/
├── cart/
├── checkout/
├── order/
├── admin/
└── shared/

Além disso:

hooks/
services/
lib/
types/
utils/

A estrutura final deve ser definida após analisar o projeto existente.

Evitar duplicação de componentes.

Se dois componentes possuem comportamento semelhante, avaliar possibilidade de abstração.

20. SERVIÇOS

Planejar uma camada de serviços separada da interface.

Exemplo:

services/
├── productService
├── cartService
├── orderService
├── paymentService
├── inventoryService
├── shippingService
└── notificationService

A interface não deve conter diretamente regras complexas de negócio.

21. BANCO DE DADOS

Planejar inicialmente entidades semelhantes a:

users
products
product_variants
product_images
categories
inventory
carts
cart_items
orders
order_items
payments
addresses
coupons
shipping
notifications

Definir posteriormente:

Relacionamentos

Chaves primárias

Chaves estrangeiras

Índices

Constraints

Status

Auditoria

A estrutura deve ser preparada para crescimento.

22. EXPERIÊNCIA DO USUÁRIO

O e-commerce deve reduzir ao máximo a fricção da compra.

Priorizar:

Navegação simples

Busca rápida

Fotos grandes e de qualidade

Informações claras

Seleção simples de tamanho/cor

Checkout objetivo

Feedback visual após ações

Estados de loading

Estados vazios

Mensagens de erro úteis

Confirmação clara das ações

Evitar excesso de pop-ups e elementos que prejudiquem a experiência.

23. FLUXO PRINCIPAL DA COMPRA

Planejar este fluxo:

HOME
↓
CATÁLOGO
↓
PRODUTO
↓
SELECIONAR VARIAÇÃO
↓
ADICIONAR AO CARRINHO
↓
CARRINHO
↓
CHECKOUT
↓
ENDEREÇO
↓
FRETE
↓
PAGAMENTO
↓
CONFIRMAÇÃO
↓
PEDIDO
↓
ACOMPANHAMENTO

Mapear também os fluxos alternativos:

Pagamento recusado

Pagamento pendente

Pedido cancelado

Produto sem estoque

Falha de comunicação com gateway

Falha no cálculo do frete

Usuário abandona o checkout

24. O QUE VOCÊ DEVE FAZER AGORA

Neste momento NÃO implemente o e-commerce inteiro.

Primeiro:

Analise os arquivos existentes.

Analise os materiais visuais fornecidos.

Identifique a identidade visual.

Identifique componentes que já existem.

Identifique dependências existentes.

Avalie a estrutura atual do projeto.

Proponha a arquitetura ideal.

Proponha a estrutura de pastas.

Proponha os componentes.

Proponha o fluxo de navegação.

Proponha o modelo inicial de banco de dados.

Proponha a arquitetura de pagamentos.

Proponha a arquitetura de pedidos.

Proponha a arquitetura administrativa.

Identifique riscos técnicos.

Identifique decisões que precisam ser tomadas antes da implementação.

25. FORMATO DA SUA RESPOSTA

Apresente o planejamento dividido em:

A. Análise do projeto atual

B. Identidade visual

C. Arquitetura técnica

D. Estrutura de pastas

E. Design System

F. Componentes React Bricks

G. Páginas

H. Fluxo de compra

I. Banco de dados

J. Sistema de pagamentos

K. Sistema de pedidos

L. Estoque

M. Painel administrativo

N. Segurança

O. SEO

P. Performance

Q. Roadmap de desenvolvimento

R. MVP

S. Funcionalidades futuras

T. Riscos e decisões técnicas

No final, apresente uma lista chamada:

DECISÕES PENDENTES

Liste tudo que ainda precisa ser decidido antes de começar a implementação.

NÃO comece a implementar essas funcionalidades ainda.

Primeiro quero validar o planejamento e a arquitetura.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2a5bde17-ec35-41c6-8aff-b93aa8794112).

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
