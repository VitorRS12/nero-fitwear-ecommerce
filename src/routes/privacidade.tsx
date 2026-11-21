import { createFileRoute } from "@tanstack/react-router";

import { LegalDocument } from "@/components/blocks/LegalDocument";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — NERO Fitwear" },
      { name: "description", content: "Como a NERO Fitwear coleta, usa, compartilha e protege seus dados pessoais, conforme a LGPD." },
      { property: "og:title", content: "Política de Privacidade — NERO Fitwear" },
      { property: "og:description", content: "Seus dados na NERO Fitwear, conforme a Lei Geral de Proteção de Dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const link = "underline hover:text-foreground";

function PrivacyPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Legal" title="Política de Privacidade">
        <LegalDocument
          updatedAt="20 de novembro de 2026"
          sections={[
            {
              title: "Apresentação",
              body: (
                <>
                  <p>A NERO FITWEAR respeita a privacidade dos visitantes e clientes de sua loja virtual e busca proteger os dados pessoais tratados durante a navegação, o cadastro, a realização de compras e o atendimento.</p>
                  <p>Esta Política explica quais informações podem ser coletadas, para quais finalidades são utilizadas, com quem podem ser compartilhadas e quais direitos os titulares possuem.</p>
                  <p>O tratamento de dados pessoais é realizado em conformidade com a Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD).</p>
                </>
              ),
            },
            {
              title: "Identificação do controlador",
              body: (
                <ul>
                  <li>Nome empresarial: 69.829.336 PEDRO HENRIQUE REIS DOS SANTOS DA SILVA</li>
                  <li>Nome fantasia: NERO FITWEAR</li>
                  <li>CNPJ: 69.829.336/0001-68</li>
                  <li>Endereço: 10A Rua Roberto Rebouças, nº 197, Centro, CEP 42850-000, Dias d'Ávila, Bahia, Brasil</li>
                  <li>E-mail para assuntos de privacidade: suporte@nerofitwear.com.br</li>
                  <li>Site: https://nerofitwear.com.br</li>
                </ul>
              ),
            },
            {
              title: "Dados pessoais que podem ser coletados",
              body: (
                <>
                  <p><strong className="text-foreground">Dados cadastrais:</strong> nome completo, e-mail, telefone e credenciais de autenticação, tratadas conforme os mecanismos de segurança da plataforma.</p>
                  <p><strong className="text-foreground">Compras e entregas:</strong> CPF, quando solicitado e necessário; endereço de entrega; produtos adquiridos; número e histórico de pedidos; informações relacionadas ao pagamento e à confirmação da transação.</p>
                  <p><strong className="text-foreground">Atendimento:</strong> conteúdo das mensagens enviadas à loja; solicitações de troca, devolução ou reembolso; informações necessárias à resolução de dúvidas e reclamações.</p>
                  <p><strong className="text-foreground">Dados técnicos:</strong> dados necessários ao funcionamento e à segurança da plataforma, como endereço IP, registros de acesso, informações do navegador e dados de sessão.</p>
                  <p>A NERO FITWEAR não utiliza ferramentas de rastreamento publicitário ou análise comportamental de terceiros. Caso sejam implementadas futuramente, esta Política será atualizada.</p>
                </>
              ),
            },
            {
              title: "Finalidades e bases legais",
              body: (
                <>
                  <ul>
                    <li>Criar e administrar contas — execução de contrato ou procedimentos preliminares;</li>
                    <li>Processar pedidos — execução de contrato;</li>
                    <li>Processar pagamentos — execução de contrato e cumprimento de obrigações legais;</li>
                    <li>Organizar entregas — execução de contrato;</li>
                    <li>Prestar atendimento — execução de contrato, obrigação legal ou legítimo interesse, conforme a solicitação;</li>
                    <li>Prevenir fraudes — legítimo interesse ou exercício regular de direitos;</li>
                    <li>Cumprir obrigações fiscais e legais — cumprimento de obrigação legal ou regulatória;</li>
                    <li>Enviar campanhas promocionais — consentimento;</li>
                    <li>Proteger o funcionamento e a segurança do site — legítimo interesse.</li>
                  </ul>
                  <p>O tratamento é limitado ao necessário para cada finalidade e respeita os princípios previstos na LGPD.</p>
                </>
              ),
            },
            {
              title: "E-mails e comunicações",
              body: (
                <>
                  <p>Enviamos comunicações relacionadas às compras, como confirmação de pedidos, atualizações de pagamento, informações de envio e entrega e respostas a solicitações de atendimento. Essas mensagens são necessárias à execução da relação comercial.</p>
                  <p>Campanhas promocionais, ofertas e novidades por e-mail são enviadas apenas mediante autorização. Você pode cancelar o recebimento a qualquer momento pelo link de descadastramento na mensagem ou entrando em contato com a loja.</p>
                  <p>O cancelamento de mensagens promocionais não impede o envio de comunicações necessárias à execução de pedidos ou ao cumprimento de obrigações legais.</p>
                </>
              ),
            },
            {
              title: "Compartilhamento de dados",
              body: (
                <>
                  <p>Para viabilizar a operação da loja, dados pessoais podem ser compartilhados com prestadores de serviço, na medida necessária às suas atividades:</p>
                  <ul>
                    <li><strong className="text-foreground">Supabase:</strong> autenticação e armazenamento das informações da plataforma;</li>
                    <li><strong className="text-foreground">Stripe:</strong> processamento de pagamentos;</li>
                    <li><strong className="text-foreground">Vercel:</strong> hospedagem e execução do site, incluindo informações técnicas necessárias ao seu funcionamento;</li>
                    <li><strong className="text-foreground">Resend:</strong> envio de e-mails relacionados à operação da loja;</li>
                    <li><strong className="text-foreground">Correios:</strong> nome, endereço, CEP e contato do destinatário, para a entrega dos pedidos.</li>
                  </ul>
                  <p>Esses fornecedores tratam dados conforme suas próprias políticas, respeitando as obrigações contratuais e legais aplicáveis. A NERO FITWEAR não comercializa dados pessoais de seus clientes.</p>
                </>
              ),
            },
            {
              title: "Pagamentos e informações financeiras",
              body: (
                <>
                  <p>Os pagamentos são processados pela Stripe. Os dados do cartão são informados diretamente no formulário seguro da Stripe e não ficam armazenados pela NERO FITWEAR.</p>
                  <p>Tratamos apenas as informações financeiras necessárias à gestão dos pedidos, à confirmação das transações, ao atendimento e ao cumprimento de obrigações legais. O tratamento realizado pela Stripe segue as políticas próprias desse fornecedor.</p>
                </>
              ),
            },
            {
              title: "Cookies e estatísticas de visitas",
              body: (
                <>
                  <p>O site guarda no seu navegador apenas o necessário para funcionar, como a sessão de login e os itens do carrinho. O formulário de pagamento da Stripe pode usar cookies próprios para segurança e prevenção de fraudes.</p>
                  <p>Usamos o Vercel Web Analytics para contar visitas de forma agregada (páginas visitadas, origem, país, navegador, sistema e tipo de aparelho), sem cookies e sem identificar visitantes. Os dados são recebidos pela Vercel, conforme a <a href="https://vercel.com/docs/analytics/privacy-policy" className={link} target="_blank" rel="noreferrer">política de privacidade do Vercel Analytics</a>.</p>
                  <p>Cookies não essenciais, como os de publicidade, só seriam usados mediante informação e escolha prévia do titular.</p>
                </>
              ),
            },
            {
              title: "Armazenamento e conservação dos dados",
              body: (
                <>
                  <p>Os dados pessoais são conservados pelo período necessário às finalidades que justificaram sua coleta, ou por períodos adicionais quando necessário ao cumprimento de obrigações legais ou regulatórias, ao exercício regular de direitos ou a outras hipóteses autorizadas pela LGPD.</p>
                  <p>Ao excluir sua conta, cadastro, endereços e avisos são apagados. Os pedidos permanecem guardados sem nome, e-mail e telefone pelo prazo exigido pela legislação fiscal (em geral 5 anos), conforme o art. 16 da LGPD.</p>
                  <p>Após o término das finalidades e prazos aplicáveis, os dados são eliminados ou anonimizados.</p>
                </>
              ),
            },
            {
              title: "Segurança da informação",
              body: (
                <>
                  <p>Adotamos medidas técnicas e administrativas para proteger os dados pessoais contra acessos não autorizados, perda, alteração, destruição ou tratamento inadequado ou ilícito, de acordo com a natureza dos dados e os riscos envolvidos.</p>
                  <p>Nenhum sistema digital é completamente livre de riscos. Em caso de incidente que possa acarretar risco ou dano relevante aos titulares, serão adotadas as providências e comunicações exigidas pela legislação.</p>
                </>
              ),
            },
            {
              title: "Direitos dos titulares",
              body: (
                <>
                  <p>Nos termos da LGPD, você pode solicitar:</p>
                  <ul>
                    <li>Confirmação da existência de tratamento e acesso aos dados;</li>
                    <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                    <li>Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
                    <li>Portabilidade, observadas as condições legais;</li>
                    <li>Eliminação dos dados tratados com consentimento, ressalvadas as hipóteses legais de conservação;</li>
                    <li>Informação sobre entidades com as quais houve compartilhamento;</li>
                    <li>Informação sobre a possibilidade de não consentir e suas consequências;</li>
                    <li>Revogação do consentimento e oposição ao tratamento, nas hipóteses legais.</li>
                  </ul>
                  <p>Você pode excluir sua conta diretamente na página Minha conta ou enviar sua solicitação para suporte@nerofitwear.com.br. Poderemos solicitar informações razoáveis para confirmar a identidade do solicitante.</p>
                </>
              ),
            },
            {
              title: "Dados de crianças e adolescentes",
              body: (
                <p>A loja não se destina especificamente ao público infantil. Caso sejam tratados dados de crianças ou adolescentes, o tratamento observará a legislação aplicável, especialmente o melhor interesse da criança e do adolescente.</p>
              ),
            },
            {
              title: "Transferência internacional de dados",
              body: (
                <p>Alguns fornecedores de tecnologia (como Supabase, Stripe, Vercel e Resend) podem tratar ou armazenar dados em infraestrutura fora do Brasil. Nesses casos, a NERO FITWEAR observa os requisitos da LGPD e a regulamentação da Autoridade Nacional de Proteção de Dados (ANPD).</p>
              ),
            },
            {
              title: "Alterações nesta Política",
              body: (
                <p>Esta Política poderá ser atualizada para refletir mudanças legais, tecnológicas ou operacionais. A versão vigente fica disponível nesta página, com a data de atualização. Quando uma alteração exigir manifestação do titular, serão adotadas as providências legais aplicáveis.</p>
              ),
            },
            {
              title: "Contato",
              body: (
                <>
                  <ul>
                    <li>Empresa: NERO FITWEAR</li>
                    <li>E-mail: suporte@nerofitwear.com.br</li>
                    <li>Endereço: 10A Rua Roberto Rebouças, nº 197, Centro, CEP 42850-000, Dias d'Ávila, Bahia, Brasil</li>
                    <li>Site: https://nerofitwear.com.br</li>
                  </ul>
                  <p>As solicitações são analisadas e respondidas conforme os prazos e procedimentos previstos na legislação.</p>
                </>
              ),
            },
          ]}
        />
      </Section>
    </StoreLayout>
  );
}
