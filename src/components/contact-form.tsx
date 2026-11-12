"use client";

import { useId, useState, type FormEvent } from "react";
import { useContent } from "@/components/content-provider";
import { IconSelect } from "@/components/icon-select";
import { getIcon } from "@/components/icon-registry";
import { edit } from "@/lib/editable";

const fieldClass =
  "mt-[10px] block w-full rounded-[25px] border border-black bg-white px-[15px] py-3 font-sans text-base leading-[1.6] text-black normal-case outline-none focus:border-black";
const labelClass = "block text-[13px] font-semibold text-[#222] uppercase";

/** "Drop us a line" form (Contact Form 7 in the original). Opens the visitor's email app with the message filled in. */
export function ContactForm() {
  const { contact: c, footer } = useContent();
  const id = useId();
  const [sent, setSent] = useState(false);
  const [referral, setReferral] = useState(c.referrals[0]?.label ?? "");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "");
    const body = [
      `${c.nameLabel}: ${name}`,
      `${c.emailLabel}: ${data.get("email") ?? ""}`,
      `${c.sessionLabel} ${data.get("session") ?? ""}`,
      `${c.referralLabel} ${data.get("referral") ?? ""}`,
      "",
      String(data.get("message") ?? ""),
    ].join("\n");
    const subject = `Contato – ${name}`;
    window.location.href = `mailto:${footer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form onSubmit={onSubmit} aria-label="Contact form" className="space-y-7">
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
          className="cursor-pointer rounded-[25px] border-2 border-black bg-black px-[1.8em] pt-[0.6em] pb-[0.5em] font-heading text-base leading-[1.5] font-semibold text-white"
        >
          <span {...edit("contact.submitLabel")}>{c.submitLabel}</span>
        </button>
      </p>
      <p role="status" aria-live="polite" className="text-sm text-black/60">
        {sent && "Your email app should open with the message ready to send."}
      </p>
    </form>
  );
}
