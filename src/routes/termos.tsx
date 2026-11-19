import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalDocument } from "@/components/blocks/LegalDocument";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — NERO Fitwear" },
      { name: "description", content: "Regras de compra, pagamento, entrega e trocas da loja NERO Fitwear." },
      { property: "og:title", content: "Termos de Uso — NERO Fitwear" },
      { property: "og:description", content: "Condições para comprar na NERO Fitwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Legal" title="Termos de Uso">
        <LegalDocument
          updatedAt="15 de novembro de 2026"
          sections={[
            {
              title: "Quem somos",
              body: (
                <p>
                  A NERO Fitwear é uma loja de roupas fitness operada por 69.829.336 PEDRO HENRIQUE REIS DOS SANTOS DA SILVA, CNPJ 69.829.336/0001-68, com
                  endereço na 10A Rua Roberto Rebouças, Centro, Dias d'Ávila/BA, CEP 42850-000.
                  Ao usar o site ou fazer uma compra, você concorda com estes termos.
                </p>
              ),
            },
            {
              title: "Cadastro",
              body: (
                <ul>
                  <li>Para comprar é necessário criar uma conta com dados verdadeiros e atualizados.</li>
                  <li>Você é responsável por manter sua senha em sigilo e pelas ações feitas na sua conta.</li>
                  <li>Podemos suspender contas usadas para fraude ou em desacordo com estes termos.</li>
                </ul>
              ),
            },
            {
              title: "Produtos, preços e estoque",
              body: (
                <ul>
                  <li>Fotos são ilustrativas; cores podem variar levemente conforme a tela.</li>
                  <li>Preços estão em reais e podem mudar sem aviso, valendo o preço exibido ao finalizar o pedido.</li>
                  <li>As peças ficam reservadas por tempo limitado enquanto o pagamento é concluído. Se o pagamento não for confirmado, a reserva é liberada.</li>
                </ul>
              ),
            },
            {
              title: "Pagamento",
              body: (
                <ul>
                  <li>Aceitamos cartão de crédito, cartão de débito, PIX e, quando disponíveis no seu aparelho, Apple Pay e Google Pay.</li>
                  <li>O pagamento é processado pela Stripe dentro do nosso site. A NERO não armazena os dados do seu cartão.</li>
                  <li>O pedido só é confirmado após a aprovação do pagamento. Pedidos com suspeita de fraude podem ser cancelados e reembolsados.</li>
                </ul>
              ),
            },
            {
              title: "Entrega e retirada",
              body: (
                <ul>
                  <li>Os envios são feitos pelos Correios, com prazo e valor mostrados no checkout. O prazo começa a contar após a confirmação do pagamento.</li>
                  <li>Você também pode escolher retirar no local, sem custo, no endereço informado acima, após o aviso de que o pedido está pronto.</li>
                  <li>Confira o endereço com atenção: reenvios por endereço incorreto podem ser cobrados.</li>
                </ul>
              ),
            },
            {
              title: "Trocas, devoluções e arrependimento",
              body: (
                <p>
                  Você pode desistir da compra em até 7 dias após o recebimento, conforme o Código de Defesa do
                  Consumidor (art. 49), com reembolso integral. Trocas de tamanho seguem a nossa{" "}
                  <Link to="/trocas" className="underline hover:text-foreground">política de trocas</Link>.
                </p>
              ),
            },
            {
              title: "Uso do site",
              body: (
                <p>
                  Textos, fotos, marca e logotipo da NERO são protegidos e não podem ser copiados sem autorização.
                  É proibido usar o site para atividades ilegais ou que prejudiquem seu funcionamento.
                </p>
              ),
            },
            {
              title: "Privacidade",
              body: (
                <p>
                  O uso dos seus dados é explicado na{" "}
                  <Link to="/privacidade" className="underline hover:text-foreground">Política de Privacidade</Link>.
                </p>
              ),
            },
            {
              title: "Contato e foro",
              body: (
                <p>
                  Dúvidas podem ser enviadas pela página de{" "}
                  <Link to="/contato" className="underline hover:text-foreground">contato</Link> ou pelo e-mail
                  [E-MAIL]. Fica eleito o foro do domicílio do consumidor, conforme a lei.
                </p>
              ),
            },
          ]}
        />
      </Section>
    </StoreLayout>
  );
}
