"use server";

import { isLoggedIn } from "@/lib/auth";
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return { ok: false, error: "Confira o e-mail." };
  if (lead.phone.replace(/\D/g, "").length < 8) return { ok: false, error: "Confira o telefone." };

  try {
    await saveLead(lead);
    return { ok: true };
  } catch (error) {
    console.error("[leads] save failed", error);
    return { ok: false, error: "Não foi possível enviar agora. Tente de novo em instantes." };
  }
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
