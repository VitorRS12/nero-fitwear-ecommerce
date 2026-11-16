import { createFileRoute } from "@tanstack/react-router";

import { LegalDocument } from "@/components/blocks/LegalDocument";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — NERO Fitwear" },
      { name: "description", content: "Como a NERO Fitwear coleta, usa e protege seus dados, conforme a LGPD." },
      { property: "og:title", content: "Política de Privacidade — NERO Fitwear" },
      { property: "og:description", content: "Seus dados na NERO Fitwear, conforme a LGPD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Legal" title="Política de Privacidade">
        <LegalDocument
          updatedAt="15 de novembro de 2026"
          sections={[
            {
              title: "Responsável pelos dados",
              body: (
                <p>
                  [RAZÃO SOCIAL], CNPJ [CNPJ], Rua Jaime Ribeiro da Silva, 101, Santa Terezinha, Dias d'Ávila/BA,
                  é a responsável pelos seus dados, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).
                  Contato para assuntos de privacidade: [E-MAIL].
                </p>
              ),
            },
            {
              title: "Dados que coletamos",
              body: (
                <ul>
                  <li>Cadastro: nome, e-mail e senha (guardada de forma protegida).</li>
                  <li>Pedidos: telefone, CPF, endereço de entrega, itens comprados e histórico de pedidos.</li>
                  <li>Pagamento: os dados do cartão são digitados diretamente no formulário da Stripe; recebemos apenas a confirmação e dados básicos da transação.</li>
                  <li>Contato: as informações que você enviar pela página de contato.</li>
                </ul>
              ),
            },
            {
              title: "Para que usamos",
              body: (
                <ul>
                  <li>Processar pagamentos, separar, enviar ou preparar a retirada dos pedidos.</li>
                  <li>Falar com você sobre pedidos, trocas e atendimento.</li>
                  <li>Prevenir fraudes e cumprir obrigações legais e fiscais.</li>
                </ul>
              ),
            },
            {
              title: "Com quem compartilhamos",
              body: (
                <ul>
                  <li>Stripe, para processar pagamentos com cartão, PIX, Apple Pay e Google Pay.</li>
                  <li>Correios, com nome e endereço, para realizar a entrega.</li>
                  <li>Nosso provedor de hospedagem e banco de dados, que guarda as informações da loja.</li>
                  <li>Autoridades, quando exigido por lei.</li>
                </ul>
              ),
            },
            {
              title: "Cookies e armazenamento no navegador",
              body: (
                <p>
                  Guardamos no seu navegador apenas o necessário para o site funcionar, como sua sessão de login e
                  os itens do carrinho. O formulário de pagamento da Stripe pode usar cookies próprios para segurança
                  e prevenção de fraudes.
                </p>
              ),
            },
            {
              title: "Estatísticas de visitas",
              body: (
                <>
                  <p>
                    Usamos as estatísticas de visitas da Lovable, que não usam cookies, não guardam nada no seu
                    aparelho, não mantêm endereços IP e não identificam visitantes. Lovable collects this data for
                    us. <a href="https://lovable.dev/privacy" className="underline hover:text-foreground" target="_blank" rel="noreferrer">Lovable's privacy policy</a> explains how it handles it.
                  </p>
                  <p>
                    São registrados, para todos os visitantes: páginas visitadas, de onde o visitante veio, país,
                    navegador, sistema operacional e tipo de aparelho, tempo no site, velocidade de carregamento das
                    páginas e erros. Os dados detalhados ficam guardados por 90 dias e os resumos diários por um ano.
                  </p>
                </>
              ),
            },
            {
              title: "Por quanto tempo guardamos",
              body: (
                <p>
                  Mantemos os dados da conta enquanto ela estiver ativa e os dados de pedidos pelo prazo exigido pela
                  legislação fiscal e de defesa do consumidor.
                </p>
              ),
            },
            {
              title: "Seus direitos",
              body: (
                <p>
                  Você pode pedir acesso, correção, exclusão, portabilidade dos seus dados ou revogar consentimentos,
                  pelo e-mail [E-MAIL]. Respondemos no prazo previsto em lei.
                </p>
              ),
            },
          ]}
        />
      </Section>
    </StoreLayout>
  );
}
