import Image from "next/image";
import { ContactForm } from "@/components/contact-form";
import { ArrowRightSolidIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getContent } from "@/lib/content-store";
import { telHref } from "@/lib/site";
import { edit, editHide, editImage, editLink } from "@/lib/editable";

export async function ContactPage() {
  const { contact, footer } = await getContent();
  const addressLines = footer.address.split("\n");

  return (
    <>
      <SiteHeader variant="page" />
      <main>
        {/* "Drop us a line" + form on a light grey band */}
        <section className="bg-[#F0F0F0] pt-10 pb-[60px] tab:pt-[60px] desk:pb-[100px]">
          <div className="mx-auto max-w-[1140px] px-5 tab:px-0">
            <h1 className="pb-10 text-center font-heading text-[40px] leading-none lowercase tab:text-[80px] desk:text-[140px]" {...edit("contact.formTitle")}>
              {contact.formTitle}
            </h1>
            <div className="mx-auto w-full tab:w-[70%]">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Address + photo (photo first on mobile) */}
        <section className="py-[60px] tab:py-20 desk:py-[100px]">
          <div className="mx-auto flex max-w-[1140px] flex-col-reverse tab:flex-row">
            <div className="flex flex-col justify-center px-5 pt-10 text-center tab:w-1/2 tab:pt-0 tab:pr-10 tab:pl-5 tab:text-left desk:pr-[60px] desk:pl-0">
              <h2 className="pb-5 font-heading text-[34px] leading-[1.1] tab:text-[40px] desk:w-[70%] desk:text-[60px]" {...edit("contact.addressTitle")}>
                {contact.addressTitle}
              </h2>
              <p className="text-[18px] leading-[1.6] tab:text-[22px]">
                {addressLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-5 text-[18px] leading-[1.6] tab:text-[22px]">
                <a href={telHref(footer.phone)} className="block" {...edit("footer.phone")}>
                  {footer.phone}
                </a>
                <a href={`mailto:${footer.email}`} className="block" {...edit("footer.email")}>
                  {footer.email}
                </a>
              </p>
              <div className="mt-10" hidden={contact.directions.hidden} {...editHide("contact.directions")}>
                <a
                  href={contact.directions.href}
                  {...editLink("contact.directions.href")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex anim-grow items-center rounded-[50px] bg-black px-[30px] py-[19px] text-[18px] leading-none font-semibold text-white"
                >
                  <span {...edit("contact.directions.label")}>{contact.directions.label}</span>
                  <ArrowRightSolidIcon className="ml-[15px] h-[18px] w-[15.75px]" />
                </a>
              </div>
            </div>
            <div className="px-5 tab:w-1/2 tab:pr-5 tab:pl-0 desk:pr-0">
              <div className="relative aspect-square overflow-hidden rounded-[15px]" {...editImage("contact.image")}>
                <Image
                  src={contact.image}
                  alt=""
                  fill
                  sizes="(min-width: 1025px) 570px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
