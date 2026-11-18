import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getContent } from "@/lib/content-store";
import { pageHref } from "@/lib/site";

/* 404 in Portuguese, with the way back to the portfolio and to a quote. Next.js sends it with status 404 and noindex. */

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

const button = "inline-block anim-grow rounded-[50px] px-[25px] py-[18px] text-center text-[18px] leading-[18px] font-semibold";

export default async function NotFound() {
  const content = await getContent();
  return (
    <>
      <SiteHeader variant="page" />
      <main className="mx-auto max-w-[1140px] px-5 py-[100px] text-center tab:py-[140px] desk:px-0">
        <p className="font-heading text-[14px] font-semibold tracking-[0.12em] text-[#6b6b6b] uppercase">Erro 404</p>
        <h1 className="mt-4 font-heading text-[34px] leading-[1.15] tab:text-[60px]">Página não encontrada</h1>
        <p className="mx-auto mt-5 max-w-[520px] text-[18px] leading-[1.6] text-[#555]">
          O endereço pode ter mudado ou não existe mais. Veja nossos trabalhos ou fale com a gente para um orçamento.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={pageHref(content, "works")} className={`${button} bg-black text-white`}>
            Ver portfólio
          </Link>
          <Link href={pageHref(content, "contact")} className={`${button} border border-black text-black`}>
            Pedir orçamento
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
