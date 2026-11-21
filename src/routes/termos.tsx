import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalDocument } from "@/components/blocks/LegalDocument";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos e Condições de Uso e Compra — NERO Fitwear" },
      { name: "description", content: "Regras de cadastro, compra, pagamento, entrega, trocas e garantia da loja NERO Fitwear." },
      { property: "og:title", content: "Termos e Condições — NERO Fitwear" },
      { property: "og:description", content: "Condições para comprar na NERO Fitwear, conforme o Código de Defesa do Consumidor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

const link = "underline hover:text-foreground";

function TermsPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Legal" title="Termos e Condições de Uso e Compra">
        <LegalDocument
          updatedAt="20 de novembro de 2026"
          sections={[
            {
              title: "Identificação da loja",
              body: (
                <>
                  <p>A NERO FITWEAR é uma loja virtual de vestuário e produtos relacionados à moda, operada pela seguinte pessoa empresária:</p>
                  <ul>
                    <li>Nome empresarial: 69.829.336 PEDRO HENRIQUE REIS DOS SANTOS DA SILVA</li>
                    <li>Nome fantasia: NERO FITWEAR</li>
                    <li>CNPJ: 69.829.336/0001-68</li>
                    <li>Endereço: 10A Rua Roberto Rebouças, nº 197, Centro, CEP 42850-000, Dias d'Ávila, Bahia, Brasil</li>
                    <li>E-mail de suporte: suporte@nerofitwear.com.br</li>
                    <li>E-mail comercial: comercial@nerofitwear.com.br</li>
                    <li>E-mail para pedidos: pedidos@nerofitwear.com.br</li>
                    <li>Site: https://nerofitwear.com.br</li>
                  </ul>
                  <p>Neste documento, a expressão “NERO FITWEAR” identifica o fornecedor responsável pela loja virtual.</p>
                </>
              ),
            },
            {
              title: "Aceitação dos termos",
              body: (
                <>
                  <p>Ao navegar, criar uma conta ou realizar uma compra no site, o usuário declara que teve acesso a estes Termos e Condições e às informações aplicáveis à utilização da plataforma e à contratação dos produtos.</p>
                  <p>A conclusão de uma compra é precedida da apresentação das informações essenciais do pedido, incluindo produtos, quantidades, preços, frete e condições de pagamento.</p>
                  <p>A aceitação destes termos não elimina nem restringe direitos assegurados pela legislação de defesa do consumidor.</p>
                </>
              ),
            },
            {
              title: "Cadastro e conta do cliente",
              body: (
                <>
                  <p>Para utilizar determinadas funcionalidades, o cliente poderá precisar criar uma conta e fornecer informações verdadeiras, completas e atualizadas.</p>
                  <p>O cliente é responsável pela confidencialidade de suas credenciais de acesso e deverá comunicar à NERO FITWEAR qualquer suspeita de utilização não autorizada de sua conta.</p>
                  <p>A NERO FITWEAR poderá adotar medidas de segurança para proteger as contas e prevenir atividades fraudulentas, respeitando os direitos do consumidor e a legislação aplicável.</p>
                </>
              ),
            },
            {
              title: "Produtos, imagens e disponibilidade",
              body: (
                <>
                  <p>A NERO FITWEAR busca apresentar informações claras sobre as características dos produtos, incluindo descrição, tamanho, cor, composição e demais especificações disponibilizadas na página de cada item.</p>
                  <p>As imagens possuem finalidade ilustrativa e representam o produto anunciado da maneira mais fiel possível. Poderão existir pequenas variações de tonalidade decorrentes de iluminação e configurações de tela, sem prejuízo das características essenciais da oferta.</p>
                  <p>A disponibilidade dos produtos é informada na loja virtual e está sujeita ao estoque existente.</p>
                </>
              ),
            },
            {
              title: "Preços, promoções e condições comerciais",
              body: (
                <>
                  <p>Os preços dos produtos são apresentados em reais (R$).</p>
                  <p>Antes de concluir a compra, o cliente visualiza o valor total, incluindo eventuais despesas de entrega e outros encargos aplicáveis.</p>
                  <p>As condições promocionais, descontos, cupons e campanhas são apresentados com suas respectivas regras e períodos de validade, quando aplicável.</p>
                  <p>A NERO FITWEAR respeita as ofertas divulgadas, observadas as disposições do Código de Defesa do Consumidor.</p>
                </>
              ),
            },
            {
              title: "Pedidos e confirmação da compra",
              body: (
                <>
                  <p>Após selecionar os produtos, o cliente pode revisar as informações do pedido antes de finalizar a contratação.</p>
                  <p>A confirmação do pedido é comunicada por meio eletrônico, utilizando os dados de contato fornecidos pelo cliente.</p>
                  <p>O processamento do pedido está sujeito à confirmação do pagamento e às verificações operacionais e antifraude aplicáveis.</p>
                  <p>Caso seja identificada alguma inconsistência relevante, a NERO FITWEAR entrará em contato com o cliente para os esclarecimentos necessários.</p>
                </>
              ),
            },
            {
              title: "Pagamentos",
              body: (
                <>
                  <p>Os pagamentos são processados pelos meios disponibilizados na etapa de finalização da compra (cartão de crédito e PIX), por meio da Stripe, conforme os procedimentos e mecanismos de segurança da plataforma de pagamentos.</p>
                  <p>A aprovação, recusa ou eventual necessidade de verificação do pagamento pode depender da instituição financeira, do emissor do cartão ou do processador de pagamentos.</p>
                  <p>A NERO FITWEAR não solicita que o cliente envie dados completos de cartão por e-mail, mensagens ou canais de atendimento.</p>
                </>
              ),
            },
            {
              title: "Entrega e envio",
              body: (
                <>
                  <p>As entregas são realizadas por meio dos Correios, conforme as modalidades disponíveis no momento da compra. Também pode estar disponível a retirada no local, com o endereço exibido ao selecionar essa opção.</p>
                  <p>O prazo e o valor do frete são apresentados ao cliente antes da conclusão do pedido, de acordo com o endereço informado e as condições de serviço disponíveis.</p>
                  <p>Após a postagem, poderão ser fornecidas informações de rastreamento, quando disponibilizadas pelos Correios.</p>
                  <p>O cliente deverá informar corretamente os dados de entrega e acompanhar as atualizações de transporte.</p>
                  <p>Em caso de atraso, extravio, avaria ou dificuldade na entrega, o cliente poderá entrar em contato pelos canais de atendimento da NERO FITWEAR.</p>
                  <p>A responsabilidade da NERO FITWEAR perante o consumidor será observada conforme a legislação aplicável, não sendo afastada pela contratação dos serviços dos Correios.</p>
                </>
              ),
            },
            {
              title: "Trocas, devoluções e direito de arrependimento",
              body: (
                <>
                  <p>As solicitações de troca e devolução são tratadas conforme a <Link to="/trocas" className={link}>Política de Trocas e Devoluções</Link> da NERO FITWEAR.</p>
                  <p>Nas compras realizadas fora do estabelecimento comercial, o consumidor pode exercer o direito de arrependimento no prazo legal de 7 (sete) dias, contado da assinatura do contrato ou do recebimento do produto, conforme o artigo 49 do Código de Defesa do Consumidor.</p>
                  <p>O exercício desse direito permite a devolução dos valores pagos, observadas as exigências legais.</p>
                  <p>As condições de troca por preferência pessoal, tamanho, cor ou outros motivos não obrigatórios por lei seguem a política comercial publicada pela loja, sem restringir direitos legais.</p>
                </>
              ),
            },
            {
              title: "Produtos com defeito e garantia legal",
              body: (
                <>
                  <p>Os produtos comercializados estão sujeitos às garantias previstas no Código de Defesa do Consumidor.</p>
                  <p>Em caso de vício ou defeito, o consumidor pode entrar em contato com a NERO FITWEAR para solicitar atendimento e apresentar as informações necessárias à análise da ocorrência.</p>
                  <p>Os prazos e procedimentos observam a legislação aplicável, inclusive as regras dos artigos 18 e 26 do Código de Defesa do Consumidor.</p>
                </>
              ),
            },
            {
              title: "Atendimento ao consumidor",
              body: (
                <>
                  <p>A NERO FITWEAR disponibiliza os seguintes canais:</p>
                  <ul>
                    <li>Suporte: suporte@nerofitwear.com.br</li>
                    <li>Pedidos: pedidos@nerofitwear.com.br</li>
                    <li>Comercial: comercial@nerofitwear.com.br</li>
                  </ul>
                  <p>Horário de atendimento: das 09h às 18h. Você também pode usar a página de <Link to="/contato" className={link}>contato</Link>.</p>
                  <p>As solicitações são tratadas conforme sua natureza e respeitando os prazos legais aplicáveis.</p>
                </>
              ),
            },
            {
              title: "Propriedade intelectual",
              body: (
                <>
                  <p>A marca NERO FITWEAR, sua identidade visual, logotipos, fotografias, textos, elementos gráficos e demais conteúdos disponibilizados no site são protegidos pela legislação aplicável.</p>
                  <p>A reprodução, distribuição ou utilização comercial desses materiais sem autorização poderá constituir violação de direitos de propriedade intelectual.</p>
                </>
              ),
            },
            {
              title: "Segurança e utilização da plataforma",
              body: (
                <>
                  <p>O usuário compromete-se a utilizar o site de maneira lícita, sem praticar atividades que prejudiquem seu funcionamento, a segurança da plataforma ou os direitos de terceiros.</p>
                  <p>A NERO FITWEAR poderá implementar medidas técnicas e operacionais para proteger o ambiente digital e prevenir fraudes, acessos indevidos e utilização abusiva.</p>
                </>
              ),
            },
            {
              title: "Privacidade e proteção de dados",
              body: (
                <p>O tratamento de dados pessoais dos usuários é realizado conforme a <Link to="/privacidade" className={link}>Política de Privacidade</Link> da NERO FITWEAR e a legislação brasileira de proteção de dados pessoais.</p>
              ),
            },
            {
              title: "Alterações destes termos",
              body: (
                <>
                  <p>Estes termos poderão ser atualizados para refletir mudanças legais, comerciais ou operacionais.</p>
                  <p>A versão vigente é disponibilizada nesta página, com indicação da data de sua última atualização.</p>
                  <p>As alterações não poderão retirar direitos já assegurados ao consumidor pela legislação aplicável.</p>
                </>
              ),
            },
            {
              title: "Legislação aplicável",
              body: (
                <>
                  <p>Estes termos são interpretados de acordo com as leis da República Federativa do Brasil, especialmente o Código de Defesa do Consumidor, o Decreto nº 7.962/2013 e demais normas aplicáveis.</p>
                  <p>Fica preservado o direito do consumidor de recorrer aos órgãos administrativos e judiciais competentes, inclusive ao foro de seu domicílio, conforme a legislação aplicável.</p>
                </>
              ),
            },
          ]}
        />
      </Section>
    </StoreLayout>
  );
}
