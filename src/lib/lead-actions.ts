"use server";

import { isLoggedIn } from "@/lib/auth";
import { sendFormEmails } from "@/lib/email/send";
import { deleteLead, listLeads, saveLead } from "@/lib/leads";

export interface LeadInput {
  service: string;
  location: string;
  employee: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Honeypot: hidden from people, bots fill it. */
  website?: string;
}

export type SendResult = { ok: true } | { ok: false; error: string };

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public: the home booking form (step 2) calls this. */
export async function sendLead(input: LeadInput): Promise<SendResult> {
  if (clean(input.website, 200)) return { ok: true }; // bot: pretend it worked

  const lead = {
    service: clean(input.service, 120),
    location: clean(input.location, 120),
    employee: clean(input.employee, 120),
    name: clean(input.name, 120),
    email: clean(input.email, 200),
    phone: clean(input.phone, 40),
    message: clean(input.message, 4000),
  };
  if (!lead.name || !lead.email || !lead.phone) return { ok: false, error: "Preencha nome, e-mail e telefone." };
  if (!EMAIL.test(lead.email)) return { ok: false, error: "Confira o e-mail." };
  if (lead.phone.replace(/\D/g, "").length < 8) return { ok: false, error: "Confira o telefone." };

  return deliver({ ...lead, source: "agendamento" }, [
    ["Serviço", lead.service],
    ["Local", lead.location],
    ["Profissional", lead.employee],
  ]);
}

export interface ContactInput {
  name: string;
  email: string;
  session: string;
  referral: string;
  message: string;
  /** Honeypot: hidden from people, bots fill it. */
  website?: string;
  /** Field labels as shown on the page, so the e-mails match the form. */
  labels: { session: string; referral: string };
}

/** Public: the contact page form calls this. */
export async function sendContact(input: ContactInput): Promise<SendResult> {
  if (clean(input.website, 200)) return { ok: true }; // bot: pretend it worked

  const name = clean(input.name, 120);
  const email = clean(input.email, 200);
  const session = clean(input.session, 120);
  const referral = clean(input.referral, 120);
  const message = clean(input.message, 4000);
  if (!name || !email) return { ok: false, error: "Preencha nome e e-mail." };
  if (!EMAIL.test(email)) return { ok: false, error: "Confira o e-mail." };

  const label = (v: unknown, fallback: string) => clean(v, 80).replace(/[?:]\s*$/, "") || fallback;
  return deliver(
    { source: "contato", service: session, location: "", employee: referral, name, email, phone: "", message },
    [
      [label(input.labels?.session, "Tipo de sessão"), session],
      [label(input.labels?.referral, "Como nos conheceu"), referral],
    ],
  );
}

/** Saves the request (admin panel) and e-mails the studio + the client. Succeeds if either the save or the notification worked. */
async function deliver(lead: Parameters<typeof saveLead>[0], fields: [string, string][]): Promise<SendResult> {
  const [saved, mailed] = await Promise.all([
    saveLead(lead).then(
      () => true,
      (error) => {
        console.error("[leads] save failed", error);
        return false;
      },
    ),
    sendFormEmails({
      kind: lead.source ?? "agendamento",
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      fields,
    }),
  ]);
  if (saved || mailed.notified) return { ok: true };
  return { ok: false, error: "Não foi possível enviar agora. Tente de novo em instantes." };
}

/** Admin: list and delete requests. */
export async function getLeads() {
  if (!(await isLoggedIn())) return { ok: false as const, error: "Sessão expirada." };
  return { ok: true as const, leads: await listLeads() };
}

export async function removeLead(key: string) {
  if (!(await isLoggedIn())) return { ok: false as const, error: "Sessão expirada." };
  await deleteLead(key);
  return { ok: true as const };
}
