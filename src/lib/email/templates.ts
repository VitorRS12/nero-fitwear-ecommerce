/**
 * Modelos de e-mail da NERO (HTML com estilos inline, compatível com clientes de e-mail).
 * Layout base: cabeçalho escuro, faixa de destaque, corpo claro, botão escuro, rodapé escuro.
 * Sem dependências: pode ser testado em qualquer ambiente.
 */

export const STORE_URL = "https://nerofitwear.com.br";
export const PICKUP_ADDRESS = "10A Roberto Rebouças, 197, Centro, Dias d'Ávila/BA, CEP 42850-000";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface OrderLine {
  name: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  total: number;
}

export interface OrderSummary {
  orderNumber: string;
  customerName: string;
  items: OrderLine[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  isPickup: boolean;
}

const C = {
  dark: "#0A0A0A",
  light: "#F5F4F0",
  ink: "#151515",
  muted: "#5C5C5C",
  line: "#DDDCD6",
  onDark: "#F5F4F0",
  onDarkMuted: "#9A9A9A",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "";
}

interface LayoutInput {
  preheader: string;
  eyebrow: string;
  title: string;
  tagline: string;
  greeting: string;
  body: string;
  cta?: { label: string; url: string };
  showCategories?: boolean;
  footerNote: string;
}

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${C.muted};">${text}</p>`;

function layout(i: LayoutInput): string {
  const cta = i.cta
    ? `<tr><td style="padding:8px 0 24px;"><a href="${i.cta.url}" style="display:block;background:${C.dark};color:${C.onDark};text-align:center;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:16px 24px;">${escapeHtml(i.cta.label)}</a></td></tr>`
    : "";
  const categories = i.showCategories
    ? `<tr><td style="border-top:1px solid ${C.line};padding:20px 0 0;">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Encontre seu ritmo</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          ${["Leggings", "Conjuntos", "Camisetas"]
            .map(
              (c) =>
                `<td align="center" style="padding:6px 0;"><a href="${STORE_URL}/catalogo/${c.toLowerCase()}" style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${C.ink};text-decoration:none;">${c}</a></td>`,
            )
            .join("")}
        </tr></table></td></tr>`
    : "";
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(i.title)}</title></head>
<body style="margin:0;padding:0;background:#1A1A1A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(i.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1A1A1A;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td align="center" style="background:${C.dark};padding:28px 24px 20px;">
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow Bold',sans-serif;font-size:36px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.onDark};line-height:1;">NERO<span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:2.5px;vertical-align:middle;color:${C.onDarkMuted};"> FITWEAR</span></div>
    <div style="margin-top:8px;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:${C.onDarkMuted};">Fitwear para o seu movimento</div>
  </td></tr>
  <tr><td style="background:${C.dark};border-top:1px solid #222;padding:40px 28px 36px;">
    <p style="margin:0 0 28px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.onDarkMuted};">${escapeHtml(i.eyebrow)}</p>
    <h1 style="margin:0;font-family:Impact,'Arial Narrow Bold','Helvetica Neue',sans-serif;font-size:44px;line-height:1.02;font-weight:700;text-transform:uppercase;color:${C.onDark};">${i.title}</h1>
    <p style="margin:20px 0 0;font-size:13px;color:#CFCFCF;">${escapeHtml(i.tagline)}</p>
  </td></tr>
  <tr><td style="background:${C.light};padding:32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td><h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${C.ink};">${escapeHtml(i.greeting)}</h2>${i.body}</td></tr>
      ${cta}${categories}
    </table>
  </td></tr>
  <tr><td align="center" style="background:${C.dark};padding:32px 24px;">
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow Bold',sans-serif;font-size:26px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.onDark};line-height:1;">NERO<span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:9px;font-weight:600;letter-spacing:2.5px;vertical-align:middle;color:${C.onDarkMuted};"> FITWEAR</span></div>
    <p style="margin:16px 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.onDark};">Seu corpo. Sua força. Seu movimento.</p>
    <p style="margin:0 0 16px;"><a href="${STORE_URL}/contato" style="font-size:12px;color:${C.onDark};">Precisa de ajuda? Fale com a NERO.</a></p>
    <p style="margin:0;font-size:10px;line-height:1.6;color:${C.onDarkMuted};">${escapeHtml(i.footerNote)}<br><a href="${STORE_URL}/privacidade" style="color:${C.onDarkMuted};">Política de Privacidade</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: OrderSummary): string {
  const rows = o.items
    .map((it) => {
      const variant = [it.color, it.size].filter(Boolean).join(" · ");
      return `<tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.ink};">${escapeHtml(it.name)}<br><span style="font-size:12px;color:${C.muted};">${escapeHtml(variant)}${variant ? " · " : ""}${it.quantity}x</span></td><td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.ink};white-space:nowrap;">${brl(it.total)}</td></tr>`;
    })
    .join("");
  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;font-size:${strong ? 15 : 13}px;color:${strong ? C.ink : C.muted};${strong ? "font-weight:700;" : ""}">${label}</td><td align="right" style="padding:6px 0;font-size:${strong ? 15 : 13}px;color:${strong ? C.ink : C.muted};${strong ? "font-weight:700;" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
    ${rows}
    ${line("Subtotal", brl(o.subtotal))}
    ${o.discount > 0 ? line("Desconto", `- ${brl(o.discount)}`) : ""}
    ${line(o.isPickup ? "Retirada no local" : "Frete", o.shippingCost > 0 ? brl(o.shippingCost) : "Grátis")}
    ${line("Total", brl(o.total), true)}
  </table>`;
}

function plain(lines: string[]): string {
  return [...lines, "", "NERO Fitwear — " + STORE_URL].join("\n");
}

const ACCOUNT_NOTE = "Você recebeu este e-mail porque tem uma conta na NERO.";
const ORDER_NOTE = "Você recebeu este e-mail porque fez um pedido na NERO.";

export function welcomeEmail(name: string): EmailContent {
  const n = firstName(name);
  return {
    subject: "Bem-vinda à NERO",
    html: layout({
      preheader: "Sua conta está pronta. Conheça a coleção.",
      eyebrow: "Seu próximo movimento começa aqui",
      title: "Bem-vinda<br>à NERO.",
      tagline: "Treine pesado. Vista sua força.",
      greeting: n ? `Olá, ${n}.` : "Olá.",
      body:
        p("Você agora faz parte da NERO. É hora de encontrar as peças que acompanham o seu ritmo — no treino e além dele.") +
        p("Compressão que sustenta, tecido que respira e modelagem que acompanha o seu movimento."),
      cta: { label: "Conhecer a coleção", url: `${STORE_URL}/catalogo` },
      showCategories: true,
      footerNote: "Você recebeu este e-mail porque se cadastrou na NERO.",
    }),
    text: plain([`Olá${n ? `, ${n}` : ""}.`, "Sua conta na NERO está pronta.", `Conheça a coleção: ${STORE_URL}/catalogo`]),
  };
}

export function orderReceivedEmail(o: OrderSummary): EmailContent {
  return {
    subject: `Recebemos seu pedido ${o.orderNumber}`,
    html: layout({
      preheader: `Pedido ${o.orderNumber} recebido. Falta só o pagamento.`,
      eyebrow: `Pedido ${o.orderNumber}`,
      title: "Pedido<br>recebido.",
      tagline: "Assim que o pagamento for confirmado, começamos a separar suas peças.",
      greeting: `Olá, ${firstName(o.customerName)}.`,
      body:
        p("Recebemos seu pedido. Se você ainda não concluiu o pagamento, finalize pelo site — as peças ficam reservadas por tempo limitado.") +
        itemsTable(o),
      cta: { label: "Ver meu pedido", url: `${STORE_URL}/conta` },
      footerNote: ORDER_NOTE,
    }),
    text: plain([`Olá, ${firstName(o.customerName)}.`, `Recebemos o pedido ${o.orderNumber} no valor de ${brl(o.total)}.`, "Assim que o pagamento for confirmado, avisamos você."]),
  };
}

export function paymentConfirmedEmail(o: OrderSummary): EmailContent {
  const next = o.isPickup
    ? "Vamos separar suas peças e avisar por e-mail quando estiverem prontas para retirada."
    : "Vamos separar e embalar suas peças. Quando o pedido sair para entrega, você recebe o código de rastreamento.";
  return {
    subject: `Pagamento confirmado — pedido ${o.orderNumber}`,
    html: layout({
      preheader: `Pagamento do pedido ${o.orderNumber} aprovado.`,
      eyebrow: `Pedido ${o.orderNumber}`,
      title: "Pagamento<br>confirmado.",
      tagline: "Suas peças já estão separadas para você.",
      greeting: `Obrigado, ${firstName(o.customerName)}.`,
      body: p(`O pagamento de ${brl(o.total)} foi aprovado. ${next}`) + itemsTable(o),
      cta: { label: "Acompanhar pedido", url: `${STORE_URL}/conta` },
      footerNote: ORDER_NOTE,
    }),
    text: plain([`Obrigado, ${firstName(o.customerName)}.`, `O pagamento do pedido ${o.orderNumber} (${brl(o.total)}) foi aprovado.`, next]),
  };
}

export function trackingEmail(input: { orderNumber: string; customerName: string; trackingCode: string }): EmailContent {
  const code = escapeHtml(input.trackingCode);
  const url = `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(input.trackingCode)}`;
  return {
    subject: `Seu pedido ${input.orderNumber} foi enviado`,
    html: layout({
      preheader: `Código de rastreamento: ${input.trackingCode}`,
      eyebrow: `Pedido ${input.orderNumber}`,
      title: "Seu pedido<br>está a caminho.",
      tagline: "Enviado pelos Correios.",
      greeting: `Olá, ${firstName(input.customerName)}.`,
      body:
        p("Seu pedido foi postado. Use o código abaixo para acompanhar a entrega:") +
        `<p style="margin:0 0 24px;padding:16px;border:1px solid ${C.line};font-family:'Courier New',monospace;font-size:18px;letter-spacing:2px;text-align:center;color:${C.ink};">${code}</p>` +
        p("A atualização do rastreamento pode levar até 24 horas para aparecer."),
      cta: { label: "Rastrear nos Correios", url },
      footerNote: ORDER_NOTE,
    }),
    text: plain([`Olá, ${firstName(input.customerName)}.`, `Seu pedido ${input.orderNumber} foi enviado.`, `Código de rastreamento: ${input.trackingCode}`, url]),
  };
}

export function pickupReadyEmail(input: { orderNumber: string; customerName: string }): EmailContent {
  return {
    subject: `Pedido ${input.orderNumber} pronto para retirada`,
    html: layout({
      preheader: "Suas peças estão te esperando.",
      eyebrow: `Pedido ${input.orderNumber}`,
      title: "Pronto para<br>retirada.",
      tagline: "Suas peças estão te esperando.",
      greeting: `Olá, ${firstName(input.customerName)}.`,
      body:
        p("Seu pedido está separado e pronto para ser retirado no endereço abaixo:") +
        `<p style="margin:0 0 16px;padding:16px;border:1px solid ${C.line};font-size:14px;line-height:1.6;color:${C.ink};">${escapeHtml(PICKUP_ADDRESS)}</p>` +
        p(`Leve um documento com foto e informe o número do pedido: <strong style="color:${C.ink};">${escapeHtml(input.orderNumber)}</strong>.`),
      cta: { label: "Falar com a NERO", url: `${STORE_URL}/contato` },
      footerNote: ORDER_NOTE,
    }),
    text: plain([`Olá, ${firstName(input.customerName)}.`, `O pedido ${input.orderNumber} está pronto para retirada em:`, PICKUP_ADDRESS, "Leve um documento com foto."]),
  };
}

export function accountDeletedEmail(name: string): EmailContent {
  const n = firstName(name);
  return {
    subject: "Sua conta na NERO foi excluída",
    html: layout({
      preheader: "Confirmação da exclusão da sua conta.",
      eyebrow: "Privacidade e LGPD",
      title: "Conta<br>excluída.",
      tagline: "Seu pedido de exclusão foi concluído.",
      greeting: n ? `Olá, ${n}.` : "Olá.",
      body:
        p("Confirmamos que sua conta e seus dados pessoais de cadastro (endereços, notificações e perfil) foram excluídos.") +
        p("Por obrigação legal e fiscal, os registros de compras anteriores são mantidos pelo prazo exigido em lei, sem seus dados de contato.") +
        p("Se você não pediu esta exclusão, responda este e-mail ou fale com a gente."),
      cta: { label: "Fale com a NERO", url: `${STORE_URL}/contato` },
      footerNote: "Este é um aviso obrigatório sobre a sua conta. Você não receberá novos e-mails.",
    }),
    text: plain([`Olá${n ? `, ${n}` : ""}.`, "Sua conta na NERO foi excluída.", "Registros fiscais de compras são mantidos pelo prazo legal, sem seus dados de contato."]),
  };
}

export function paymentFailedEmail(input: { orderNumber: string; customerName: string }): EmailContent {
  return {
    subject: `Pagamento não aprovado — pedido ${input.orderNumber}`,
    html: layout({
      preheader: "Não conseguimos confirmar seu pagamento.",
      eyebrow: `Pedido ${input.orderNumber}`,
      title: "Pagamento<br>não aprovado.",
      tagline: "Nenhum valor foi cobrado.",
      greeting: `Olá, ${firstName(input.customerName)}.`,
      body:
        p("O pagamento do seu pedido não foi aprovado. Isso pode acontecer por limite, dados do cartão ou recusa do banco.") +
        p("Você pode tentar novamente com outro cartão ou com PIX enquanto as peças estiverem reservadas."),
      cta: { label: "Tentar novamente", url: `${STORE_URL}/carrinho` },
      footerNote: ORDER_NOTE,
    }),
    text: plain([`Olá, ${firstName(input.customerName)}.`, `O pagamento do pedido ${input.orderNumber} não foi aprovado.`, `Tente novamente: ${STORE_URL}/carrinho`]),
  };
}
