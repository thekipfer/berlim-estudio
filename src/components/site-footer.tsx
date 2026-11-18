import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getIcon } from "@/components/icon-registry";
import { getContent } from "@/lib/content-store";
import { telHref } from "@/lib/site";
import { edit, editImage, editLink } from "@/lib/editable";

function ColumnTitle({ children, path }: { children: ReactNode; path: string }) {
  return (
    <h3 className="mb-5 text-xs font-medium tracking-[0.2em] text-white/50 uppercase" {...edit(path)}>
      {children}
    </h3>
  );
}

export async function SiteFooter() {
  const { footer, brand } = await getContent();

  return (
    <footer className="bg-black text-white">
      <section className="pt-[60px] pb-[60px] desk:pt-20 desk:pb-20">
        <div className="mx-auto grid max-w-[1140px] grid-cols-1 gap-y-12 px-5 text-center tab:grid-cols-3 tab:gap-x-10 tab:text-left desk:px-0">
          {/* Contact */}
          <div>
            <ColumnTitle path="footer.contactTitle">{footer.contactTitle}</ColumnTitle>
            <address className="leading-[1.7] not-italic">
              {footer.address.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </address>
            <div className="mt-5 leading-[1.7]">
              <a href={telHref(footer.phone)} className="block transition-opacity hover:opacity-60" {...edit("footer.phone")}>
                {footer.phone}
              </a>
              <a href={`mailto:${footer.email}`} className="block transition-opacity hover:opacity-60" {...edit("footer.email")}>
                {footer.email}
              </a>
            </div>
          </div>

          {/* Menu */}
          <nav aria-label="Rodapé">
            <ColumnTitle path="footer.menuTitle">{footer.menuTitle}</ColumnTitle>
            <ul className="space-y-1">
              {footer.links.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="leading-[1.7] lowercase transition-opacity hover:opacity-60"
                    {...editLink(`footer.links.${i}.href`)}
                    {...edit(`footer.links.${i}.label`)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Socials */}
          <div>
            <ColumnTitle path="footer.followTitle">{footer.followTitle}</ColumnTitle>
            <ul className="flex justify-center gap-3 tab:justify-start">
              {footer.socials.map((social, i) => {
                const Icon = getIcon(social.icon);
                return (
                  <li key={i}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className="flex size-11 items-center justify-center rounded-full border border-white/25 transition-colors duration-300 hover:border-white hover:bg-white hover:text-black"
                    >
                      <Icon className="size-[18px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/15 py-8">
        <div className="mx-auto flex max-w-[1140px] flex-col items-center gap-4 px-5 tab:flex-row tab:justify-between desk:px-0">
          <Link href="/" className="inline-block" {...editImage("brand.logoFooter")}>
            <Image
              src={brand.logoFooter}
              alt="Berlim Estúdio"
              width={1000}
              height={179}
              sizes="150px"
              className="h-auto w-[140px] tab:w-[150px]"
            />
          </Link>
          <p className="flex items-center gap-1.5 text-sm text-white/60">
            Feito com
            <span aria-label="amor">♥</span>
            por
            <a
              href="https://thekipfer.com"
              target="_blank"
              rel="noreferrer"
              className="text-white transition-opacity hover:opacity-60"
            >
              The Kipfer
            </a>
          </p>
        </div>
      </section>
    </footer>
  );
}
