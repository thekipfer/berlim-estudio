import type { Metadata } from "next";
import { isConfigured, isLoggedIn } from "@/lib/auth";
import { getContent, usesBlob } from "@/lib/content-store";
import { Editor } from "./editor";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Editor – Berlim Estúdio",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 font-sans">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-sm text-neutral-600">
          <div className="font-heading text-2xl font-bold text-neutral-900">BERLIM</div>
          <p className="mt-3">
            O editor ainda não foi configurado. Defina <code>ADMIN_EMAIL</code> e <code>ADMIN_PASSWORD</code> nas variáveis
            de ambiente do projeto.
          </p>
        </div>
      </div>
    );
  }

  if (!(await isLoggedIn())) return <LoginForm />;

  const content = await getContent();
  return <Editor initial={content} storage={usesBlob() ? "blob" : "local"} />;
}
