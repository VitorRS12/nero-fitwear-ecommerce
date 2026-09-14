# Guia técnico — NERO Fitwear

Este documento explica como executar o projeto localmente, onde ficam os dados, como a identidade da marca está distribuída e quais arquivos concentram as mudanças mais comuns.

> Estado deste guia: setembro de 2026. O banco de dados usado pelo projeto é um Supabase externo e remoto. Portanto, clonar somente o código não cria uma cópia local do banco.

---

## 1. Resumo da tecnologia

| Área | Tecnologia | Onde começa |
| --- | --- | --- |
| Aplicação web | TanStack Start + React 19 | `src/routes/` |
| Linguagem | TypeScript, modo estrito | `tsconfig.json` |
| Compilação e servidor local | Vite | `vite.config.ts` |
| Estilos | Tailwind CSS v4 + tokens próprios | `src/styles.css` |
| Componentes básicos | shadcn/ui + Radix UI | `src/components/ui/` |
| Rotas | TanStack Router por arquivos | `src/routes/` |
| Dados em tela e cache | TanStack Query | `src/services/` e `src/router.tsx` |
| Banco, login e arquivos | Supabase | `src/integrations/supabase/` |
| Validação | Zod | funções em `src/lib/*.functions.ts` |
| Carrinho | React Context + `localStorage` | `src/providers/cart-provider.tsx` |
| Ícones | Lucide React | componentes que importam `lucide-react` |

O projeto usa o alias `@/` para representar a pasta `src/`. Exemplo: `@/components/ui/button` significa `src/components/ui/button.tsx`. A configuração está em `tsconfig.json`.

---

## 2. Como executar na máquina local

### 2.1 Pré-requisitos

- Git.
- Bun. O projeto foi verificado com Bun `1.3.3`.
- Node.js moderno para compatibilidade das ferramentas. O ambiente atual usa Node `22.22.0`.
- Acesso ao projeto Supabase conectado, caso seja necessário consultar dados, usuários, Storage ou obter as variáveis locais.

### 2.2 Baixar e instalar

No terminal:

```bash
git clone <URL-DO-REPOSITORIO>
cd <PASTA-DO-PROJETO>
bun install
```

O arquivo `bun.lock` fixa as versões instaladas. Use preferencialmente Bun, em vez de misturar npm, Yarn ou pnpm, para evitar a alteração desnecessária desse arquivo.

### 2.3 Criar o arquivo de ambiente

Crie `.env` na raiz do projeto. Não envie esse arquivo ao Git e nunca coloque a chave administrativa em um nome iniciado por `VITE_`.

```dotenv
# Valores públicos usados pelo navegador
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# Valores usados no servidor
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=

# Necessária para operações privilegiadas do servidor, inclusive o proxy
# que entrega as imagens do bucket privado. Nunca use o prefixo VITE_.
SUPABASE_SERVICE_ROLE_KEY=
```

As variáveis públicas e de servidor podem apontar para o mesmo projeto Supabase, mas possuem finalidades diferentes:

- `VITE_*`: entram no código do navegador. Só podem conter URL, identificador e chave publicável.
- Sem `VITE_`: ficam disponíveis no servidor.
- `SUPABASE_SERVICE_ROLE_KEY`: ignora as regras de acesso do banco. É secreta, exclusiva do servidor e não pode ser exibida, enviada ao navegador ou salva no banco.

No projeto atual:

- Referência do Supabase: `eslgqwmqqsndxyrwqwfe`.
- Identificador do projeto Lovable: `2a5bde17-ec35-41c6-8aff-b93aa8794112`.

Esses dois identificadores não são a mesma coisa. O primeiro identifica o banco no Supabase; o segundo identifica o projeto na Lovable.

### 2.4 Iniciar o desenvolvimento

```bash
bun run dev
```

Abra o endereço mostrado pelo Vite no terminal. A porta pode variar se a porta padrão estiver ocupada.

### 2.5 Comandos disponíveis

| Comando | Função |
| --- | --- |
| `bun run dev` | Inicia o servidor local com atualização automática. |
| `bun run build` | Gera e valida a versão de produção. |
| `bun run build:dev` | Gera uma compilação usando o modo de desenvolvimento. |
| `bun run preview` | Abre localmente uma compilação já gerada. |
| `bun run lint` | Verifica padrões e problemas de código. |
| `bun run format` | Formata os arquivos com Prettier. |

Antes de considerar uma mudança pronta, execute pelo menos:

```bash
bun run lint
bun run build
```

### 2.6 O que não vem apenas com o código

Algumas informações vivem fora do repositório:

- Registros reais das tabelas, usuários e permissões vivem no Supabase remoto.
- Fotos dos produtos e da página inicial vivem no Storage do Supabase.
- Valores secretos são configurados no ambiente da Lovable e precisam ser configurados separadamente na máquina local.
- `src/assets/nero-mark.png.asset.json` é uma referência gerenciada pela Lovable, não o arquivo PNG original. Ele aponta para uma URL interna usada pela animação de carregamento.

Para uma cópia local totalmente independente, também é necessário exportar/importar a estrutura e os dados do Supabase e copiar os arquivos do Storage. O repositório, sozinho, não realiza essa clonagem.

---

## 3. Organização do código TypeScript

### `src/routes/` — páginas e endereços

Cada arquivo representa uma página ou endpoint. Os nomes com `$` são parâmetros dinâmicos.

| Endereço | Arquivo | Finalidade |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Página inicial e ordem dos blocos. |
| `/catalogo` | `src/routes/catalogo.tsx` | Catálogo, filtros, busca e ordenação. |
| `/catalogo/:categoria` | `src/routes/catalogo.$categoria.tsx` | Catálogo filtrado por categoria. |
| `/produto/:slug` | `src/routes/produto.$slug.tsx` | Detalhes, fotos, cor, tamanho e compra. |
| `/carrinho` | `src/routes/carrinho.tsx` | Sacola e quantidades. |
| `/checkout` | `src/routes/checkout.tsx` | Resumo do fechamento da compra. |
| `/auth` | `src/routes/auth.tsx` | Login e cadastro com e-mail e senha. |
| `/conta` | `src/routes/conta.tsx` | Área da conta do cliente. |
| `/entrega` | `src/routes/entrega.tsx` | Política de entrega. |
| `/trocas` | `src/routes/trocas.tsx` | Política de trocas e devoluções. |
| `/contato` | `src/routes/contato.tsx` | Informações de contato. |
| `/admin/produtos` | `src/routes/_authenticated/admin.produtos.index.tsx` | Lista administrativa de peças. |
| `/admin/produtos/novo` | `src/routes/_authenticated/admin.produtos.novo.tsx` | Cadastro de peça. |
| `/admin/produtos/:id` | `src/routes/_authenticated/admin.produtos.$id.tsx` | Edição, variações e fotos. |
| `/admin/tela-inicial` | `src/routes/_authenticated/admin.tela-inicial.tsx` | Fotos da capa e faixa da página inicial. |
| `/api/public/img/*` | `src/routes/api/public/img/$.tsx` | Entrega pública e cache das imagens privadas. |

Arquivos especiais:

- `src/routes/__root.tsx`: estrutura global, fontes, metadados comuns, carrinho, mensagens e área onde todas as páginas são renderizadas.
- `src/routes/_authenticated/route.tsx`: bloqueia as páginas administrativas para quem não está autenticado.
- `src/routeTree.gen.ts`: arquivo gerado automaticamente pelo TanStack Router. **Não editar manualmente.**
- `src/router.tsx`: cria o roteador e o cliente de cache.

### `src/components/` — partes visuais

- `admin/`: formulários e telas da área restrita.
  - `ProductForm.tsx`: campos principais da peça.
  - `VariantMatrix.tsx`: cores, tamanhos, SKUs, preços e estoque.
  - `ImageUploader.tsx`: envio, ordenação, cor e descrição das fotos.
  - `HomeMediaSlot.tsx`: escolha, ocultação e remoção de imagens da tela inicial.
  - `AdminShell.tsx`: menu e verificação visual da área administrativa.
- `blocks/`: blocos reutilizáveis da loja.
  - `Hero.tsx`: capa principal.
  - `ProductCard.tsx`: cartão de uma peça no catálogo.
  - `ProductGrid.tsx`: grade de peças.
  - `ProductGallery.tsx`: slide com foto principal, setas e miniaturas.
  - `PromotionalBanner.tsx`: faixa de coleção na página inicial.
  - `FeatureSection.tsx`, `Testimonials.tsx`, `Newsletter.tsx`: benefícios, depoimentos e newsletter.
- `layout/`: cabeçalho, rodapé e estrutura comum.
- `shared/`: elementos compartilhados, como marca e imagem provisória de produto.
- `ui/`: componentes básicos do design system. Antes de criar um botão, campo, modal ou seleção do zero, verifique se já existe aqui.

### `src/services/` — acesso organizado aos dados e regras isoladas

- `product.service.ts`: consultas públicas de categorias e produtos.
- `admin-product.service.ts`: tipos e consultas usadas pelo painel.
- `home-media.service.ts`: tipos, cache e localização dos espaços `hero` e `banner`.
- `shipping.service.ts`: tabela provisória de frete e limite de frete grátis.

### `src/lib/` — funções de servidor e utilidades

- `catalog.functions.ts`: leitura pública do catálogo e das imagens da home no Supabase.
- `admin-catalog.functions.ts`: gravação administrativa de produtos, variações, fotos e imagens da home.
- `product-images.ts`: nome do bucket, transformação de caminho em URL e criação de slugs.
- `format.ts`: formatação de valores.
- `error-*` e `lovable-error-reporting.ts`: tratamento e registro de falhas.

Arquivos terminados em `.functions.ts` podem ser chamados pela interface, mas a execução sensível ocorre no servidor. Não importe o cliente administrativo do Supabase no topo desses arquivos; ele deve ser carregado apenas dentro do código executado no servidor.

### `src/types/` — tipos do negócio

- `catalog.ts`: categoria, produto, foto, variação e filtros.
- `cart.ts`: item, totais, cupom e frete.

### Entradas e configurações

- `src/start.ts`: tratamento de falhas, proteção CSRF e envio do token de login às funções do servidor.
- `src/server.ts`: entrada do servidor e página segura para falhas graves.
- `vite.config.ts`: configuração TanStack/Vite fornecida pela Lovable.
- `tsconfig.json`: TypeScript estrito e alias `@/`.
- `components.json`: configuração do shadcn/ui.
- `bunfig.toml`: política de instalação de dependências.

---

## 4. Onde ficam as informações do banco de dados

### 4.1 Fonte real e fonte de tipos

A fonte real é o projeto remoto do Supabase. A pasta `src/integrations/supabase/` contém a ligação do código com esse serviço:

- `client.ts`: cliente usado no navegador e sujeito às políticas RLS. É gerado pela integração; não editar diretamente.
- `auth-middleware.ts`: valida o token nas funções protegidas. É gerado; não editar diretamente.
- `client.server.ts`: cliente administrativo exclusivo do servidor. Ignora RLS e deve ser usado somente em operações realmente privilegiadas.
- `types.ts`: espelho TypeScript da estrutura do banco. É gerado pela API do Supabase; **não editar manualmente**.

`supabase/config.toml` guarda somente a referência do projeto Supabase. Ele não contém todas as tabelas nem os dados.

No estado atual do repositório, não há uma pasta versionada com todo o histórico SQL das migrações. Isso significa que a estrutura completa deve ser consultada no Supabase e que futuras alterações precisam ser aplicadas por migração e mantidas no fluxo de migração do projeto. Não tente reconstruir a estrutura alterando `types.ts`.

### 4.2 Tabelas principais

| Tabela | Função |
| --- | --- |
| `products` | Nome, slug, descrições, preços, categoria, coleção e estados da peça. |
| `product_variants` | SKU, cor, hexadecimal da cor, tamanho, preço específico, estoque e atividade. |
| `product_images` | Fotos ligadas à peça, texto alternativo, cor, posição e foto principal. |
| `categories` | Categorias exibidas no menu e catálogo. |
| `collections` | Coleções às quais as peças podem pertencer. |
| `home_media` | Imagem da capa (`hero`) e imagem da faixa (`banner`) da página inicial. |
| `profiles` | Nome e telefone associados ao usuário autenticado. |
| `user_roles` | Papéis separados do perfil, como `admin` e `customer`. |
| `addresses` | Endereços salvos pelo cliente. |
| `orders` | Pedido, cliente, endereço, totais e estados de pedido/pagamento. |
| `order_items` | Fotografia dos itens, preços e variações no momento da compra. |
| `order_status_history` | Histórico de alterações do pedido. |
| `payments` | Identificação, método, estado e retorno do provedor de pagamento. |
| `shipments` | Transportadora, rastreio e datas de envio/entrega. |
| `coupons` | Código, tipo, valor, validade e limite de uso. |
| `inventory_movements` | Auditoria de reservas, baixas, devoluções e ajustes de estoque. |
| `notifications` | Avisos direcionados a clientes ou administradores. |

### 4.3 Funções importantes do banco

- `has_role(user_id, role)`: verifica permissões sem consultar uma informação manipulável no navegador.
- `handle_new_user()`: cria perfil e papel `customer` após um novo cadastro.
- `commit_variant_stock(...)`: baixa estoque de forma atômica e registra o movimento.
- `restock_variant(...)`: devolve estoque e registra o movimento.
- `set_updated_at()`: atualiza automaticamente a data de modificação.
- `rls_auto_enable()`: ativa RLS nas novas tabelas públicas.

### 4.4 Segurança e permissões

- O acesso de administrador depende de uma linha em `user_roles`, não de um campo em `profiles` e nunca de `localStorage`.
- As políticas RLS restringem gravação de catálogo a administradores e dados pessoais ao próprio usuário.
- O navegador usa a chave publicável e continua sujeito a RLS.
- O cliente de `client.server.ts` usa a chave administrativa e ignora RLS; por isso nunca deve chegar à interface.
- Alterações de estrutura devem incluir permissões `GRANT`, ativação de RLS e políticas coerentes.

### 4.5 Imagens e Storage

O bucket `product-images` é privado.

Fluxo de uma foto de produto:

1. `ImageUploader.tsx` envia o arquivo para o Storage como usuário administrador.
2. `admin-catalog.functions.ts` registra em `product_images` uma URL no formato `/api/public/img/<caminho>`.
3. `src/routes/api/public/img/$.tsx` baixa o arquivo com autorização do servidor e o entrega com cache público.
4. A galeria e os cartões exibem essa URL.

As fotos da tela inicial usam o mesmo bucket, dentro do caminho `home/`, mas são registradas na tabela `home_media`.

---

## 5. Onde está a identidade da marca

As informações de marca não estão concentradas em um único arquivo. Atualmente elas estão divididas entre código, estilos, metadados e conteúdo do banco.

### 5.1 Nome e assinatura visual

`src/components/shared/BrandMark.tsx` exibe a palavra `nero` e o complemento `fitwear` por tipografia. Esse componente é **provisório** e foi criado para ser o ponto principal de troca quando o logotipo oficial em SVG ou PNG transparente estiver disponível.

Ele aparece no cabeçalho e no rodapé. Alterar somente textos espalhados não substitui corretamente a assinatura visual; a troca oficial deve começar por esse componente.

`src/assets/nero-mark.png.asset.json` referencia uma marca em PNG usada somente na animação entre páginas por `src/components/layout/RouteLoadingOverlay.tsx`. Como é uma referência gerenciada pela Lovable, recomenda-se guardar futuramente o arquivo oficial real no repositório e importá-lo diretamente, para que a marca não dependa de um endereço interno da plataforma.

`public/favicon.png` é o ícone da aba do navegador.

### 5.2 Cores, fontes e linguagem visual

A fonte principal da identidade visual no código é `src/styles.css`:

- Paleta monocromática dark-first.
- Tokens de fundo, superfícies, texto, linhas, ações e estados.
- Fonte de títulos: Bebas Neue.
- Fonte de texto: Barlow.
- Largura padrão de conteúdo: utilitário `container-nero`.
- Labels em caixa alta: utilitário `label-caps`.
- Profundidade por camadas e linhas de 1 px, sem sombras fortes e sem gradientes coloridos.

As fontes são carregadas no cabeçalho global em `src/routes/__root.tsx`. Se a tipografia oficial mudar, atualize tanto os links das fontes nesse arquivo quanto os tokens `--font-display` e `--font-sans` em `src/styles.css`.

Não coloque cores fixas em componentes. Uma mudança de cor deve ser feita nos tokens semânticos de `src/styles.css` para se propagar de forma consistente.

### 5.3 Nome, descrição e informações para buscadores

`src/routes/__root.tsx` concentra:

- autor e nome global do site;
- nome da organização no JSON-LD;
- descrição resumida da organização;
- fontes e favicon.

Cada página em `src/routes/` possui seus próprios títulos e descrições para buscadores. Ao renomear a marca, é necessário pesquisar por `NERO`, `NERO Fitwear`, `nero` e `nerofitwear` em toda a pasta `src/`.

### 5.4 Frases, políticas e informações comerciais

Estas informações estão fixas no código e precisam ser confirmadas pelo proprietário antes da publicação:

- Slogan `Força · Foco · Liberdade`: `src/components/layout/Footer.tsx`.
- Instagram `@nerofitwear`: `src/components/layout/Footer.tsx`.
- O link atual do Instagram aponta apenas para `https://instagram.com`, não para o perfil específico.
- Frete grátis acima de R$ 399: `src/services/shipping.service.ts`, `src/components/blocks/FeatureSection.tsx`, `src/routes/index.tsx` e `src/routes/entrega.tsx`.
- Fretes e prazos provisórios por região: `src/services/shipping.service.ts`.
- PIX, cartão e Mercado Pago: textos em `Footer.tsx`, `FeatureSection.tsx` e `checkout.tsx`. A tela de checkout informa que a conexão real ainda não foi concluída.
- Política de trocas em até 30 dias: `src/routes/trocas.tsx`.
- Textos da capa e coleção: `src/routes/index.tsx`.
- Depoimentos: `src/components/blocks/Testimonials.tsx`; devem ser substituídos por depoimentos reais.
- Newsletter: `src/components/blocks/Newsletter.tsx`; a interface existe, mas deve ser ligada a um serviço real antes de coletar contatos.

### 5.5 Imagens da marca e da página inicial

As imagens que mudam pelo painel não ficam no Git:

- Painel: `/admin/tela-inicial`.
- Controle visual: `src/components/admin/HomeMediaSlot.tsx`.
- Dados: tabela `home_media`.
- Arquivos: bucket privado `product-images`, pasta `home/`.
- Uso na home: `src/routes/index.tsx` passa as URLs para `Hero.tsx` e `PromotionalBanner.tsx`.

Os espaços permitidos atualmente são:

- `hero`: capa no topo.
- `banner`: faixa promocional no meio da página.

Para criar um terceiro espaço, não basta adicionar uma foto. É necessário ampliar o tipo `HomeSlot`, a validação de `homeSlotSchema`, a tela administrativa, o componente visual e o consumo em `src/routes/index.tsx`.

---

## 6. Caminhos rápidos para mudanças futuras

### Trocar logo, nome ou slogan

1. Logo principal: `src/components/shared/BrandMark.tsx`.
2. Marca de carregamento: `src/components/layout/RouteLoadingOverlay.tsx` e o arquivo real da imagem.
3. Favicon: `public/favicon.png`.
4. Nome e organização: `src/routes/__root.tsx`.
5. Nome nos títulos: arquivos em `src/routes/`.
6. Slogan e redes sociais: `src/components/layout/Footer.tsx`.

### Mudar cores, fontes, raios ou largura

- Tokens e utilitários: `src/styles.css`.
- Carregamento das fontes: `src/routes/__root.tsx`.
- Variantes dos botões: `src/components/ui/button.tsx`.

### Mudar a página inicial

- Ordem, textos e ligação dos blocos: `src/routes/index.tsx`.
- Aparência de cada bloco: `src/components/blocks/`.
- Imagens administráveis: `/admin/tela-inicial`, `HomeMediaSlot.tsx` e `home_media.service.ts`.

### Mudar cabeçalho, menu ou rodapé

- Cabeçalho: `src/components/layout/Header.tsx`.
- Rodapé: `src/components/layout/Footer.tsx`.
- Composição comum da loja: `src/components/layout/StoreLayout.tsx`.

### Mudar cadastro de produtos

- Campos: `src/components/admin/ProductForm.tsx`.
- Cores, tamanhos e estoque: `src/components/admin/VariantMatrix.tsx`.
- Fotos: `src/components/admin/ImageUploader.tsx`.
- Validação e gravação: `src/lib/admin-catalog.functions.ts`.
- Tipos administrativos e cache: `src/services/admin-product.service.ts`.
- Estrutura real: tabelas `products`, `product_variants` e `product_images` no Supabase.

### Mudar catálogo ou produto

- Consultas ao banco: `src/lib/catalog.functions.ts`.
- Cache e parâmetros: `src/services/product.service.ts`.
- Tipos: `src/types/catalog.ts`.
- Página do catálogo: `src/routes/catalogo.tsx`.
- Página de categoria: `src/routes/catalogo.$categoria.tsx`.
- Página da peça: `src/routes/produto.$slug.tsx`.
- Cartão e galeria: `src/components/blocks/ProductCard.tsx` e `ProductGallery.tsx`.

### Mudar carrinho, frete ou checkout

- Estado e cálculos do carrinho: `src/providers/cart-provider.tsx`.
- Tipos: `src/types/cart.ts`.
- Sacola: `src/routes/carrinho.tsx`.
- Frete provisório: `src/services/shipping.service.ts`.
- Checkout: `src/routes/checkout.tsx`.

O carrinho atual é salvo no navegador com a chave `nero.cart.v1`; ele não é sincronizado com uma tabela do banco.

### Mudar login e acesso administrativo

- Login/cadastro: `src/routes/auth.tsx`.
- Proteção de rotas autenticadas: `src/routes/_authenticated/route.tsx`.
- Token nas funções do servidor: `src/start.ts`.
- Verificação de administrador: `adminIsAdmin` e `assertAdmin` em `src/lib/admin-catalog.functions.ts`.
- Papéis reais: tabela `user_roles` e função SQL `has_role`.

### Criar uma nova página

1. Crie um arquivo em `src/routes/` conforme o endereço desejado.
2. Use `createFileRoute` do TanStack Router.
3. Adicione título, descrição, `og:title`, `og:description`, `og:type` e `twitter:card` próprios.
4. Use `StoreLayout` se for uma página pública da loja.
5. Para uma página que exige login, coloque-a sob `_authenticated/`.
6. Não edite `src/routeTree.gen.ts`; ele é regenerado automaticamente.

---

## 7. Fluxos importantes

### Leitura pública do catálogo

```text
Página em src/routes
  → consulta em src/services/product.service.ts
  → função em src/lib/catalog.functions.ts
  → Supabase com chave publicável
  → RLS permite apenas registros públicos/ativos
  → TanStack Query guarda o resultado em cache
```

### Gravação administrativa

```text
Componente da área restrita
  → função de servidor em admin-catalog.functions.ts
  → requireSupabaseAuth valida o usuário
  → assertAdmin consulta has_role no banco
  → RLS confirma a permissão
  → tabela ou Storage é alterado
  → cache da tela é invalidado
```

### Carrinho

```text
Página do produto
  → CartProvider
  → estado React
  → localStorage do navegador (nero.cart.v1)
  → páginas de carrinho e checkout
```

---

## 8. Arquivos que não devem ser editados diretamente

- `.env`: pode ser alterado localmente, mas nunca enviado ao repositório ou compartilhado.
- `src/routeTree.gen.ts`: gerado pelo roteador.
- `src/integrations/supabase/types.ts`: gerado a partir do banco.
- `src/integrations/supabase/client.ts`: gerado pela integração.
- `src/integrations/supabase/client.server.ts`: gerado pela integração.
- `src/integrations/supabase/auth-middleware.ts`: gerado pela integração.
- Arquivos de migração gerenciados pela ferramenta do Supabase: alterações de estrutura devem ser feitas por uma nova migração, nunca reescrevendo o histórico já aplicado.

Também evite:

- colocar chaves secretas em componentes ou variáveis `VITE_*`;
- consultar o cliente administrativo a partir do navegador;
- verificar administrador apenas na interface;
- gravar papéis de usuário na tabela `profiles`;
- buscar dados diretamente dentro de componentes quando já existe uma camada em `services/`;
- colocar regras de estoque, pagamento ou permissão somente na interface;
- inserir cores fixas nos componentes em vez dos tokens de `src/styles.css`.

---

## 9. Situação funcional atual e pendências visíveis

Já existe:

- página inicial, catálogo, categorias e produto;
- variações por cor/tamanho e estoque;
- múltiplas fotos por peça e galeria em slide com miniaturas;
- carrinho persistido no navegador;
- login/cadastro;
- painel administrativo de peças, fotos e imagens da página inicial;
- estrutura de banco para pedidos, pagamentos, envios, cupons e notificações.

Ainda precisa de confirmação ou implementação completa antes de produção:

- logotipo oficial no lugar da assinatura tipográfica provisória;
- cópia local/versionada completa das migrações atuais do banco;
- credenciais e fluxo real do Mercado Pago;
- criação completa de pedidos no checkout e acompanhamento pelo cliente;
- integração real de frete, caso a tabela provisória não seja mantida;
- provedor real para newsletter e e-mails transacionais;
- links oficiais de redes sociais, políticas e textos comerciais;
- depoimentos reais;
- domínio final, URLs canônicas absolutas e publicação.

---

## 10. Checklist antes de publicar uma mudança

- [ ] A mudança usa os tokens de `src/styles.css`.
- [ ] Textos comerciais e dados da marca foram confirmados.
- [ ] Nenhum segredo foi incluído no código ou em uma variável `VITE_*`.
- [ ] As funções do servidor validam a entrada com Zod.
- [ ] Alterações no banco têm migração, `GRANT`, RLS e políticas.
- [ ] Imagens possuem descrição alternativa e dimensões estáveis.
- [ ] Páginas novas têm metadados próprios.
- [ ] A mudança foi testada em tela grande e celular.
- [ ] `bun run lint` terminou sem erros.
- [ ] `bun run build` terminou sem erros.
