# NERO Fitwear

**E-commerce de moda fitness em desenvolvimento.** Uma experiência de compra com visual monocromático, catálogo de peças por categoria e uma área restrita para cuidar dos produtos e das imagens da loja.

> **Estado atual:** PIX integrado ao Mercado Pago para testes. Cartão ainda não está disponível. Não use esta versão para vendas reais sem validar o fluxo completo com contas de teste e configurar a confirmação automática no ambiente publicado.

## O que já está disponível

**Na loja**

- Página inicial com imagens administráveis, destaques, lançamentos e exploração interativa das categorias.
- Catálogo por categoria, com busca e filtros; página de produto com galeria de fotos em slide e seleção de cor e tamanho.
- Sacola com quantidades e persistência no navegador.
- Cadastro e login; checkout autenticado com endereço, frete provisório e PIX com QR Code e código copia e cola. Pedidos ficam aguardando até confirmação do provedor.

**Na área restrita**

- Cadastro e edição de peças, variações (SKU, cor, tamanho, preço e estoque) e múltiplas fotos.
- Gestão de categorias e suas capas, além das imagens da página inicial.
- Ajuste do enquadramento das fotos por arraste, inclusive nas capas das categorias.
- Acesso administrativo controlado por papéis no banco de dados.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Aplicação | React 19, TypeScript e TanStack Start / TanStack Router |
| Interface | Tailwind CSS v4, componentes Radix UI / shadcn e Lucide |
| Dados em tela | TanStack Query |
| Backend e arquivos | Supabase (PostgreSQL, Auth e Storage) |
| Ferramentas | Vite e Bun |

O projeto usa um design system dark-first em `src/styles.css`, com cores semânticas e identidade visual em preto, branco e tons de cinza.

## Executar localmente

**Pré-requisitos:** Bun, Node.js moderno, acesso a um projeto Supabase configurado e às variáveis de ambiente correspondentes. O código, por si só, não traz os usuários, dados nem as fotos armazenadas remotamente.

```bash
git clone <URL-DO-SEU-REPOSITORIO>
cd <NOME-DA-PASTA>
bun install
```

Configure **suas próprias** variáveis em `.env.local` na raiz (não compartilhe nem publique esse arquivo):

```dotenv
# Chave publicável: acessível ao navegador
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# Configuração do servidor
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
SUPABASE_SERVICE_ROLE_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
LOVABLE_CRON_SECRET=
```

As chaves privadas ficam apenas no servidor e jamais recebem prefixo `VITE_`. Antes de rodar migrações ou testar pedidos, confirme que as variáveis e a CLI apontam para o projeto **de teste** desejado. O estoque é reservado na criação do pedido; não faça testes com pagamentos reais.

### Testar PIX

Use credenciais de teste do Mercado Pago e configure a notificação de pagamentos para a URL HTTPS `<ORIGEM-DO-SITE>/api/public/mercado-pago/webhook`. Na máquina local, exponha temporariamente essa rota com um túnel HTTPS; `localhost` não recebe notificações externas. O retorno é conferido com o Mercado Pago e uma consulta da tela também verifica o estado do pedido.

Para liberar reservas de cobranças expiradas, agende uma chamada `POST` a `<ORIGEM-DO-SITE>/api/public/mercado-pago/expire` com o cabeçalho `Authorization: Bearer <LOVABLE_CRON_SECRET>` em intervalos regulares. A limpeza consulta o provedor e cancela a cobrança pendente antes de devolver o estoque; ela não está agendada automaticamente. Não use a função SQL `release_expired_pix_orders()` diretamente, pois ela não consulta o provedor. Teste pagamento aprovado, expirado e notificações repetidas antes de publicar para compradores.

> **Antes de tornar o repositório público:** o arquivo `.env` já está versionado neste projeto. Revise seu conteúdo e histórico, retire segredos do Git e substitua quaisquer chaves privadas que tenham sido expostas. Usar `.env.local` daqui em diante não apaga segredos de commits antigos.

```bash
bun run dev
```

Abra o endereço exibido no terminal. Outros comandos disponíveis:

```bash
bun run lint       # verifica o código
bun run build      # gera a versão de produção
bun run preview    # abre uma compilação já gerada
```

### Banco de dados e fotos

As migrações SQL ficam em `supabase/migrations/`. Para preparar um projeto Supabase **separado para testes**, instale e autentique a CLI do Supabase, confira a referência do projeto e então execute:

```bash
supabase link --project-ref <REFERENCIA-DO-PROJETO-DE-TESTE>
supabase db push
```

**Confirme o destino antes de aceitar a aplicação das migrações.** A estrutura SQL não transfere automaticamente usuários ou imagens. O bucket `product-images` também precisa existir no projeto de destino para os uploads funcionarem; consulte o [guia técnico](GUIA_TECNICO_NERO_FITWEAR.md) para o fluxo de arquivos e permissões.

## Organização do projeto

```text
src/
├── routes/                 # páginas, layouts e endpoints da aplicação
├── components/
│   ├── admin/              # formulários da área restrita
│   ├── blocks/             # elementos visuais da loja
│   ├── layout/             # cabeçalho, rodapé e estrutura compartilhada
│   └── ui/                 # controles reutilizáveis
├── services/               # consultas, cache e regras de apresentação
├── lib/                    # funções de servidor e utilitários
├── providers/              # estado do carrinho
├── integrations/supabase/  # clientes e autenticação
├── types/                  # tipos do domínio
└── styles.css              # tokens e estilos globais
supabase/migrations/        # histórico SQL versionado
```

**Pontos de partida para alterações:**

| Quero alterar… | Onde começar |
| --- | --- |
| Seções da página inicial | `src/routes/index.tsx` e `src/components/blocks/` |
| Catálogo e busca | `src/routes/catalogo*`, `src/services/product.service.ts` |
| Galeria e seleção de tamanho | `src/routes/produto.$slug.tsx`, `src/components/blocks/ProductGallery.tsx` |
| Produtos e fotos do painel | `src/components/admin/`, `src/lib/admin-catalog.functions.ts` |
| Carrinho | `src/providers/cart-provider.tsx` |
| Checkout e criação do pedido | `src/routes/_authenticated/checkout.tsx`, `src/lib/checkout.functions.ts` |
| Cores, fontes e controles | `src/styles.css`, `src/components/ui/` |
| Tabelas e permissões | `supabase/migrations/` |

O [guia técnico completo](GUIA_TECNICO_NERO_FITWEAR.md) traz mais detalhes sobre ambiente, banco, identidade da marca e fluxo dos dados.

## Próximos passos antes de vender

- Validar ponta a ponta PIX aprovado, recusado e expirado com usuários de teste; agendar a limpeza de reservas e configurar notificações HTTPS.
- Implementar cartão apenas em uma etapa futura, com tokenização apropriada.
- Validar fretes, textos comerciais e imagens oficiais da marca; conectar serviços reais para newsletter e comunicações, se forem utilizados.
- Testar o fluxo completo em um Supabase de teste antes de habilitar compras em produção.

Desenvolvido com [Lovable](https://lovable.dev) e mantido neste repositório.
