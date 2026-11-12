"use client";

import Image from "next/image";
import { useId, useState, type FormEvent } from "react";
import { useContent } from "@/components/content-provider";
import { IconSelect, type IconSelectOption } from "@/components/icon-select";
import { getIcon } from "@/components/icon-registry";
import type { IconOption } from "@/types/content";
import { edit, editImage } from "@/lib/editable";
import { sendLead } from "@/lib/lead-actions";
import { cn } from "@/lib/utils";

const labelClass = "block font-heading text-base leading-[2] font-semibold";

/** Dropdown options: a first "empty" choice followed by the editable list. */
const toOptions = (first: IconOption, firstValue: string, list: IconOption[]): IconSelectOption[] => [
  { value: firstValue, label: first.label, Icon: getIcon(first.icon) },
  ...list.map((o) => ({ value: o.label, label: o.label, Icon: getIcon(o.icon) })),
];

const fieldClass =
  "mt-[6px] block w-full rounded-[25px] border border-black bg-white px-[15px] py-3 text-base leading-[1.6] text-black outline-none focus:border-black";
const primaryButton =
  "cursor-pointer rounded-[25px] border-2 border-black bg-black px-[1.8em] pt-[0.6em] pb-[0.5em] text-center font-heading text-base leading-[1.5] font-semibold text-white transition-opacity duration-200 disabled:opacity-50";

/** Shown while sending and after the request was saved. */
function ThankYou({ sending, onReset }: { sending: boolean; onReset: () => void }) {
  const { appointment: a } = useContent();
  return (
    <div className="rounded-[15px] bg-[#f6f6f6] px-6 py-10 text-center tab:px-10" role="status" aria-live="polite">
      {sending ? (
        <p {...edit("appointment.sendingMessage")}>{a.sendingMessage}</p>
      ) : (
        <>
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-black text-white">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="font-heading text-[20px] leading-[1.4] font-semibold" {...edit("appointment.successMessage")}>
            {a.successMessage}
          </p>
          <button type="button" onClick={onReset} className="mt-6 cursor-pointer text-sm underline underline-offset-4">
            <span {...edit("appointment.newReservationLabel")}>{a.newReservationLabel}</span>
          </button>
        </>
      )}
    </div>
  );
}

/** "Vamos conversar" form: step 1 picks the service, step 2 collects contact details, then a thank-you. */
export function AppointmentSection() {
  const { appointment: a } = useContent();
  const id = useId();
  const [service, setService] = useState("");
  const [location, setLocation] = useState("0");
  const [employee, setEmployee] = useState("0");
  const [step, setStep] = useState<"service" | "details" | "sending" | "done">("service");
  const [error, setError] = useState("");

  const choice = (value: string, any: IconOption) => (value === "0" ? any.label : value);

  // Step 1 → step 2
  const onNext = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (service) setStep("details");
  };

  // Step 2 → save the request → thank-you
  const onSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError("");
    setStep("sending");
    const result = await sendLead({
      service,
      location: choice(location, a.locationAny),
      employee: choice(employee, a.employeeAny),
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
    });
    if (result.ok) setStep("done");
    else {
      setError(result.error);
      setStep("details");
    }
  };

  const reset = () => {
    setService("");
    setLocation("0");
    setEmployee("0");
    setError("");
    setStep("service");
  };

  return (
    <section className="py-[60px] tab:py-20 desk:py-[100px]">
      <div className="mx-auto flex max-w-[1140px] flex-col-reverse tab:flex-row">
        <div className="px-5 pt-10 tab:w-1/2 tab:pt-0 tab:pr-10 tab:pl-5 desk:pr-[60px] desk:pl-0">
          <h2 className={cn("w-full text-center font-heading text-[34px] leading-[1.1] tab:text-left tab:text-[40px] desk:w-[70%] desk:text-[60px]", a.subtitle && step === "service" ? "pb-5" : "pb-10")} {...edit("appointment.title")}>
            {a.title}
          </h2>
          {a.subtitle && step === "service" && (
            <p
              className="w-full pb-10 text-center text-[17px] leading-[1.6] text-muted-text tab:text-left"
              {...edit("appointment.subtitle")}
            >
              {a.subtitle}
            </p>
          )}

          {step === "service" && (
            <form onSubmit={onNext}>
              <div className="mb-5 py-[1.6px]">
                <label htmlFor={`${id}-service`} className={labelClass}>
                  <span {...edit("appointment.serviceLabel")}>{a.serviceLabel}</span>{" "}
                  <strong className="font-black">
                    <abbr title="Required">*</abbr>
                  </strong>
                </label>
                <IconSelect
                  id={`${id}-service`}
                  name="service"
                  options={toOptions(a.servicePlaceholder, "", a.services)}
                  value={service}
                  onChange={setService}
                  required
                />
              </div>
              <div className="mb-5 py-[1.6px]">
                <label htmlFor={`${id}-location`} className={labelClass} {...edit("appointment.locationLabel")}>
                  {a.locationLabel}
                </label>
                <IconSelect
                  id={`${id}-location`}
                  name="location"
                  options={toOptions(a.locationAny, "0", a.locations)}
                  value={location}
                  onChange={setLocation}
                />
              </div>
              <div className="mb-5 py-[1.6px]">
                <label htmlFor={`${id}-employee`} className={labelClass} {...edit("appointment.employeeLabel")}>
                  {a.employeeLabel}
                </label>
                <IconSelect
                  id={`${id}-employee`}
                  name="employee"
                  options={toOptions(a.employeeAny, "0", a.employees)}
                  value={employee}
                  onChange={setEmployee}
                />
              </div>
              <p className="mt-10 flex py-[1.6px] text-left">
                <button
                  type="submit"
                  className="w-full max-w-[50%] cursor-pointer rounded-[25px] border-2 border-black bg-black px-[1.8em] pt-[0.6em] pb-[0.5em] text-center font-heading text-base leading-[1.5] font-semibold text-white transition-[color,background,opacity] duration-200 ease-linear"
                >
                  <span {...edit("appointment.submitLabel")}>{a.submitLabel}</span>
                </button>
              </p>
            </form>
          )}

          {step === "details" && (
            <form onSubmit={onSend}>
              <div className="space-y-5">
                <p>
                  <label htmlFor={`${id}-name`} className={labelClass}>
                    <span {...edit("appointment.detailsNameLabel")}>{a.detailsNameLabel}</span> <abbr title="Required">*</abbr>
                  </label>
                  <input id={`${id}-name`} name="name" type="text" required autoComplete="name" maxLength={120} className={fieldClass} />
                </p>
                <div className="grid grid-cols-1 gap-5 desk:grid-cols-2">
                  <p>
                    <label htmlFor={`${id}-email`} className={labelClass}>
                      <span {...edit("appointment.detailsEmailLabel")}>{a.detailsEmailLabel}</span> <abbr title="Required">*</abbr>
                    </label>
                    <input id={`${id}-email`} name="email" type="email" required autoComplete="email" maxLength={200} className={fieldClass} />
                  </p>
                  <p>
                    <label htmlFor={`${id}-phone`} className={labelClass}>
                      <span {...edit("appointment.detailsPhoneLabel")}>{a.detailsPhoneLabel}</span> <abbr title="Required">*</abbr>
                    </label>
                    <input
                      id={`${id}-phone`}
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      minLength={8}
                      title="Digite um telefone com DDD"
                      maxLength={40}
                      className={fieldClass}
                    />
                  </p>
                </div>
                <p>
                  <label htmlFor={`${id}-message`} className={labelClass} {...edit("appointment.detailsMessageLabel")}>
                    {a.detailsMessageLabel}
                  </label>
                  <textarea id={`${id}-message`} name="message" rows={5} maxLength={4000} className={cn(fieldClass, "resize-y")} />
                </p>
                {/* Honeypot: invisible to people, filled by bots */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              </div>

              {error && (
                <p role="alert" className="mt-5 text-sm text-red-600">
                  {error}
                </p>
              )}

              <p className="mt-8 flex items-center gap-5">
                <button type="submit" className={cn(primaryButton, "w-full max-w-[50%]")}>
                  <span {...edit("appointment.sendLabel")}>{a.sendLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep("service")}
                  className="cursor-pointer font-heading text-base font-semibold text-muted-text underline underline-offset-4 transition-colors hover:text-black"
                >
                  <span {...edit("appointment.backLabel")}>{a.backLabel}</span>
                </button>
              </p>
            </form>
          )}

          {(step === "sending" || step === "done") && <ThankYou sending={step === "sending"} onReset={reset} />}
        </div>

        <div className="px-5 tab:w-1/2 tab:pr-5 tab:pl-0 desk:pr-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[15px]" {...editImage("appointment.image")}>
            <Image
              src={a.image}
              alt=""
              fill
              sizes="(min-width: 1025px) 570px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
