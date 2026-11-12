"use client";

import { useCallback, useEffect, useState } from "react";
import { getLeads, removeLead } from "@/lib/lead-actions";
import type { Lead } from "@/lib/leads";

type Row = Lead & { key: string };

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** WhatsApp link from a Brazilian phone ("(48) 99999-0000" → 5548999990000). */
const whatsapp = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
};

/** Requests sent through the home form (step 2). */
export function LeadsPanel({ onCount }: { onCount?: (n: number) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await getLeads();
    if (result.ok) {
      setRows(result.leads);
      onCount?.(result.leads.length);
    } else setError(result.error);
  }, [onCount]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (row: Row) => {
    if (!window.confirm(`Apagar a mensagem de ${row.name}?`)) return;
    const result = await removeLead(row.key);
    if (result.ok) load();
    else setError(result.error);
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!rows) return <p className="text-sm text-neutral-400">Carregando…</p>;
  if (!rows.length)
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
        Nenhuma mensagem ainda. Os pedidos enviados pelo formulário da home aparecem aqui.
      </div>
    );

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key} className="rounded-2xl border border-neutral-200 bg-white p-4 tab:p-5">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <div className="min-w-0 flex-1">
              <div className="font-heading text-lg font-semibold">{row.name}</div>
              <div className="text-xs text-neutral-400">{dateFormat.format(new Date(row.createdAt))}</div>
            </div>
            <button
              type="button"
              onClick={() => remove(row)}
              className="cursor-pointer rounded-md px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              Apagar
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {[row.service, row.location, row.employee].filter(Boolean).map((v, i) => (
              <span key={i} className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                {v}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={`mailto:${row.email}`} className="text-neutral-900 underline underline-offset-4">
              {row.email}
            </a>
            <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`} className="text-neutral-900 underline underline-offset-4">
              {row.phone}
            </a>
            <a href={whatsapp(row.phone)} target="_blank" rel="noreferrer" className="text-emerald-700 underline underline-offset-4">
              WhatsApp ↗
            </a>
          </div>

          {row.message && <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm whitespace-pre-wrap text-neutral-700">{row.message}</p>}
        </li>
      ))}
    </ul>
  );
}
