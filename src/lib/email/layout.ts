/*
 * HTML for transactional emails. Email clients ignore most CSS, so this is table-based
 * with inline styles only. Every piece of user input must go through `esc`.
 */

export const SITE_URL = (process.env.SITE_URL || "https://berlimestudio.com").replace(/\/$/, "");
const LOGO_URL = `${SITE_URL}/images/berlim-estudio-logo-black.png`;

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const INK = "#111111";
const MUTED = "#6b6b6b";
const FAINT = "#a3a3a3";
const RULE = "#ececec";

export const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Escaped text with line breaks kept. */
export const multiline = (value: unknown) => esc(value).replace(/\r?\n/g, "<br>");

export interface FooterInfo {
  address: string;
  phone: string;
  email: string;
  instagram?: string;
}

export function heading(text: string) {
  return `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:${INK};">${esc(text)}</h1>`;
}

export function paragraph(html: string) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${MUTED};">${html}</p>`;
}

/** Label / value rows. Values are escaped here; empty values are skipped. */
export function details(rows: [label: string, value: string, href?: string][]) {
  const body = rows
    .filter(([, value]) => value && value.trim())
    .map(([label, value, href]) => {
      const shown = href
        ? `<a href="${esc(href)}" style="color:${INK};text-decoration:underline;">${multiline(value)}</a>`
        : multiline(value);
      return `<tr>
  <td style="padding:14px 0;border-top:1px solid ${RULE};vertical-align:top;width:34%;font-family:${FONT};font-size:11px;line-height:1.6;letter-spacing:0.08em;text-transform:uppercase;color:${FAINT};">${esc(label)}</td>
  <td style="padding:14px 0 14px 16px;border-top:1px solid ${RULE};vertical-align:top;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};">${shown}</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;border-collapse:collapse;border-bottom:1px solid ${RULE};">${body}</table>`;
}

export function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;"><tr>
  <td style="border-radius:999px;background:${INK};">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;letter-spacing:0.02em;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(label)}</a>
  </td>
</tr></table>`;
}

/** Full document: logo header, content, minimal footer. `preheader` is the inbox preview line. */
export function emailLayout({ preheader, content, footer }: { preheader: string; content: string; footer: FooterInfo }) {
  const siteLabel = SITE_URL.replace(/^https?:\/\//, "");
  const contactLine = [footer.phone, footer.email].filter(Boolean).map(esc).join("&nbsp;&nbsp;·&nbsp;&nbsp;");
  const links = [
    `<a href="${SITE_URL}" style="color:${MUTED};text-decoration:none;">${esc(siteLabel)}</a>`,
    footer.instagram ? `<a href="${esc(footer.instagram)}" style="color:${MUTED};text-decoration:none;">Instagram</a>` : "",
  ]
    .filter(Boolean)
    .join("&nbsp;&nbsp;·&nbsp;&nbsp;");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>Berlim Estúdio</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;">
      <tr><td style="padding:40px 40px 28px;border-bottom:1px solid ${RULE};">
        <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="112" height="20" alt="BERLIM" style="display:block;border:0;width:112px;height:auto;font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:0.08em;color:${INK};"></a>
      </td></tr>
      <tr><td style="padding:36px 40px 24px;">
        ${content}
      </td></tr>
      <tr><td style="padding:24px 40px 36px;border-top:1px solid ${RULE};font-family:${FONT};font-size:12px;line-height:1.7;color:${FAINT};">
        ${footer.address ? `${multiline(footer.address)}<br>` : ""}
        ${contactLine ? `${contactLine}<br>` : ""}
        ${links}
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:${FONT};font-size:11px;color:${FAINT};">Berlim Estúdio · Fotografia e Vídeo</p>
  </td></tr>
</table>
</body>
</html>`;
}
