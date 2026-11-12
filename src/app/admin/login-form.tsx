"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { login } from "./actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-neutral-900";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 font-sans">
      <form action={action} className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <Image
          src="/images/berlim-estudio-logo-blk.png"
          alt="Berlim Estúdio"
          width={1000}
          height={340}
          preload
          className="mx-auto h-auto w-[180px]"
        />

        <label className="mt-8 block text-[13px] font-medium text-neutral-700">
          E-mail
          <input name="email" type="email" required autoComplete="username" autoFocus className={inputClass} />
        </label>
        <label htmlFor="admin-password" className="mt-4 block text-[13px] font-medium text-neutral-700">
          Senha
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            title={showPassword ? "Esconder senha" : "Mostrar senha"}
            className="absolute top-1/2 right-1.5 mt-[3px] flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>

        {state && !state.ok && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full cursor-pointer rounded-lg bg-neutral-900 py-2.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
