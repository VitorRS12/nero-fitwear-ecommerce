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
          updatedAt="18 de novembro de 2026"
          sections={[
            {
              title: "Responsável pelos dados",
              body: (
                <p>
                  69.829.336 PEDRO HENRIQUE REIS DOS SANTOS DA SILVA, CNPJ 69.829.336/0001-68 , 10A Rua Roberto Rebouças, Centro, Dias d'Ávila/BA,
                  é a responsável pelos seus dados, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).
                  Contato para assuntos de privacidade: suporte@nerofitwear.com.br.
                </p>
              ),
            },
            {
              title: "Dados que coletamos",
              body: (
                <ul>
                  <li>Cadastro: nome, e-mail e senha (guardada de forma protegida). Se você entrar com Google ou Apple, recebemos apenas nome e e-mail.</li>
                  <li>Aceite: data e versão em que você aceitou os Termos e esta Política.</li>
                  <li>Pedidos: telefone, CPF, endereço de entrega, itens comprados e histórico de pedidos.</li>
                  <li>Pagamento: os dados do cartão são digitados diretamente no formulário da Stripe; recebemos apenas a confirmação e dados básicos da transação.</li>
                  <li>Contato: as informações que você enviar pela página de contato.</li>
                </ul>
              ),
            },
            {
              title: "Para que usamos",
              body: (
                <>
                <ul>
                  <li>Processar pagamentos, separar, enviar ou preparar a retirada dos pedidos.</li>
                  <li>Falar com você sobre pedidos, trocas e atendimento.</li>
                  <li>Prevenir fraudes e cumprir obrigações legais e fiscais.</li>
                </ul>
                <p>
                  Bases legais (LGPD, art. 7º): execução de contrato (compras e entrega), cumprimento de obrigação
                  legal (notas e registros fiscais), legítimo interesse (prevenção a fraudes) e consentimento
                  (aceite no cadastro). Não vendemos seus dados.
                </p>
                </>
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
                  Mantemos os dados da conta enquanto ela estiver ativa. Ao excluir a conta, apagamos cadastro,
                  endereços e avisos na hora. Os pedidos ficam guardados sem nome, e-mail e telefone pelo prazo exigido
                  pela legislação fiscal (em geral 5 anos), conforme o art. 16 da LGPD.
                </p>
              ),
            },
            {
              title: "Seus direitos",
              body: (
                <p>
                  Pelo art. 18 da LGPD, você pode confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir
                  anonimização, portabilidade, informação sobre compartilhamento e revogar o consentimento. A exclusão
                  da conta pode ser feita por você mesmo em "Minha conta". Os demais pedidos podem ser enviados para
                  suporte@nerofitwear.com.br e são respondidos em até 15 dias. Você também pode reclamar à ANPD (gov.br/anpd).
                </p>
              ),
            },
          ]}
        />
      </Section>
    </StoreLayout>
  );
}
