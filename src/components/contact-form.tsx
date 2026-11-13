"use client";

import { useId, useState, type FormEvent } from "react";
import { useContent } from "@/components/content-provider";
import { IconSelect } from "@/components/icon-select";
import { getIcon } from "@/components/icon-registry";
import { edit } from "@/lib/editable";
import { sendContact } from "@/lib/lead-actions";

const fieldClass =
  "mt-[10px] block w-full rounded-[25px] border border-black bg-white px-[15px] py-3 font-sans text-base leading-[1.6] text-black normal-case outline-none focus:border-black";
const labelClass = "block text-[13px] font-semibold text-[#222] uppercase";

/** Contact page form: saves the message (admin panel) and e-mails the studio and the visitor. */
export function ContactForm() {
  const { contact: c } = useContent();
  const id = useId();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [referral, setReferral] = useState(c.referrals[0]?.label ?? "");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError("");
    setStatus("sending");
    const result = await sendContact({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      session: String(data.get("session") ?? ""),
      referral: String(data.get("referral") ?? ""),
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
      labels: { session: c.sessionLabel, referral: c.referralLabel },
    });
    if (result.ok) {
      form.reset();
      setStatus("sent");
    } else {
      setError(result.error);
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={onSubmit} aria-label="Formulário de contato" className="space-y-7">
      {/* Honeypot: hidden from people, bots fill it */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {/* Name + email side by side on desktop */}
      <div className="grid grid-cols-1 gap-7 desk:grid-cols-2 desk:gap-x-5">
        <p>
          <label htmlFor={`${id}-name`} className={labelClass} {...edit("contact.nameLabel")}>
            {c.nameLabel}
          </label>
          <input id={`${id}-name`} name="name" type="text" required autoComplete="name" className={fieldClass} />
        </p>
        <p>
          <label htmlFor={`${id}-email`} className={labelClass} {...edit("contact.emailLabel")}>
            {c.emailLabel}
          </label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" className={fieldClass} />
        </p>
      </div>
      {c.sessionTypes.length > 0 && (
        <fieldset>
          <legend className={labelClass} {...edit("contact.sessionLabel")}>
            {c.sessionLabel}
          </legend>
          <div className="mt-[10px] flex flex-wrap gap-x-5 gap-y-2">
            {c.sessionTypes.map((type, i) => {
              const Icon = getIcon(type.icon);
              return (
                <label
                  key={i}
                  className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#222] uppercase"
                >
                  <input type="radio" name="session" value={type.label} defaultChecked={i === 0} className="size-4 accent-black" />
                  <Icon className="size-[18px]" />
                  <span {...edit(`contact.sessionTypes.${i}.label`)}>{type.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      {c.referrals.length > 0 && (
        <div>
          <label htmlFor={`${id}-referral`} className={labelClass} {...edit("contact.referralLabel")}>
            {c.referralLabel}
          </label>
          <div className="mt-[10px] normal-case">
            <IconSelect
              id={`${id}-referral`}
              name="referral"
              options={c.referrals.map((r) => ({ value: r.label, label: r.label, Icon: getIcon(r.icon) }))}
              value={referral}
              onChange={setReferral}
            />
          </div>
        </div>
      )}
      <p>
        <label htmlFor={`${id}-message`} className={labelClass} {...edit("contact.messageLabel")}>
          {c.messageLabel}
        </label>
        <textarea id={`${id}-message`} name="message" rows={10} className={`${fieldClass} resize-y`} />
      </p>
      <p className="pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="cursor-pointer rounded-[25px] disabled:cursor-default disabled:opacity-60 border-2 border-black bg-black px-[1.8em] pt-[0.6em] pb-[0.5em] font-heading text-base leading-[1.5] font-semibold text-white"
        >
          {status === "sending" ? "Enviando…" : <span {...edit("contact.submitLabel")}>{c.submitLabel}</span>}
        </button>
      </p>
      <p role="status" aria-live="polite" className={error ? "text-sm text-red-600" : "text-sm text-black/60"}>
        {error || (status === "sent" && "Mensagem enviada! Você vai receber uma confirmação no seu e-mail.")}
      </p>
    </form>
  );
}
