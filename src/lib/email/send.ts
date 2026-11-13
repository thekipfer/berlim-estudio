import { Resend } from "resend";
import { getContent } from "@/lib/content-store";
import { telHref } from "@/lib/site";
import { SITE_URL, button, details, emailLayout, esc, heading, paragraph, type FooterInfo } from "@/lib/email/layout";

/*
 * Emails sent when someone fills a form on the site (server-only):
 *  1. a notification to the studio, with every field (Reply goes straight to the client);
 *  2. an automatic confirmation to the client.
 *
 * Env: RESEND_API (or RESEND_API_KEY) — required to send anything.
 *      LEADS_TO_EMAIL — where notifications go (default: the e-mail shown in the site footer).
 *      EMAIL_FROM — sender of both emails (default: Berlim Estúdio <contato@berlimestudio.com>;
 *                   the domain must be verified in Resend).
 *      SITE_URL — used for the logo and links (default: https://berlimestudio.com).
 */

export type FormKind = "agendamento" | "contato";

export interface FormSubmission {
  kind: FormKind;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  /** Extra answers shown as label/value rows, in order. */
  fields: [label: string, value: string][];
}

const apiKey = () => process.env.RESEND_API || process.env.RESEND_API_KEY || "";
const FROM = () => process.env.EMAIL_FROM || "Berlim Estúdio <contato@berlimestudio.com>";

const TITLES: Record<FormKind, { notify: string; label: string }> = {
  agendamento: { notify: "Novo pedido de orçamento", label: "Formulário de agendamento (página inicial)" },
  contato: { notify: "Nova mensagem de contato", label: "Formulário de contato" },
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

async function footerInfo(): Promise<{ footer: FooterInfo; studioEmail: string }> {
  const { footer } = await getContent();
  const instagram = footer.socials.find((s) => s.icon === "instagram" && s.href && s.href !== "#")?.href;
  return {
    footer: { address: footer.address, phone: footer.phone, email: footer.email, instagram },
    studioEmail: footer.email,
  };
}

export function notificationHtml(s: FormSubmission, footer: FooterInfo) {
  const title = TITLES[s.kind];
  const content = [
    heading(title.notify),
    paragraph(`${esc(s.name)} preencheu o ${esc(title.label.toLowerCase())}. Responda este e-mail para falar direto com ${s.name.trim() ? esc(firstName(s.name)) : "o cliente"}.`),
    details([
      ["Nome", s.name],
      ["E-mail", s.email, `mailto:${s.email}`],
      ["Telefone", s.phone ?? "", s.phone ? telHref(s.phone) : undefined],
      ...s.fields,
      ["Mensagem", s.message ?? ""],
    ]),
    button(`Responder ${firstName(s.name) || "cliente"}`, `mailto:${s.email}?subject=${encodeURIComponent("Re: seu contato com a Berlim Estúdio")}`),
  ].join("");
  return emailLayout({ preheader: `${s.name} · ${s.email}`, content, footer });
}

export function confirmationHtml(s: FormSubmission, footer: FooterInfo) {
  const name = firstName(s.name);
  const summary: [string, string][] = [...s.fields, ["Sua mensagem", s.message ?? ""]];
  const content = [
    heading(name ? `Obrigado, ${name}.` : "Obrigado pelo contato."),
    paragraph("Recebemos sua mensagem. Nossa equipe vai responder em breve pelo e-mail ou telefone que você informou. Este é o resumo do que você nos enviou:"),
    summary.some(([, v]) => v.trim()) ? details(summary) : "",
    paragraph("Enquanto isso, fique à vontade para conhecer alguns dos nossos trabalhos."),
    button("Visitar o site", SITE_URL),
    `<p style="margin:28px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#111111;">Até logo,<br>Equipe Berlim Estúdio</p>`,
  ].join("");
  return emailLayout({ preheader: "Recebemos sua mensagem. Em breve entraremos em contato.", content, footer });
}

/**
 * Sends both emails. Never throws: returns whether the studio notification went out.
 * Missing configuration is logged, so a form still works without email.
 */
export async function sendFormEmails(s: FormSubmission): Promise<{ notified: boolean }> {
  const key = apiKey();
  if (!key) {
    console.warn("[email] RESEND_API is not set: form e-mails were not sent.");
    return { notified: false };
  }
  const resend = new Resend(key);
  const { footer, studioEmail } = await footerInfo();
  const to = process.env.LEADS_TO_EMAIL || studioEmail;

  const [notify, confirm] = await Promise.allSettled([
    resend.emails.send({
      from: FROM(),
      to,
      replyTo: s.email,
      subject: `${TITLES[s.kind].notify} — ${s.name}`,
      html: notificationHtml(s, footer),
    }),
    resend.emails.send({
      from: FROM(),
      to: s.email,
      replyTo: studioEmail,
      subject: "Recebemos sua mensagem — Berlim Estúdio",
      html: confirmationHtml(s, footer),
    }),
  ]);

  const failed = (r: typeof notify) => r.status === "rejected" || Boolean(r.value.error);
  const reason = (r: typeof notify) => (r.status === "rejected" ? r.reason : r.value.error);
  if (failed(notify)) console.error("[email] notification failed", reason(notify));
  if (failed(confirm)) console.error("[email] confirmation failed", reason(confirm));
  return { notified: !failed(notify) };
}
