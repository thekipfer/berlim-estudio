import Link from "next/link";
import { ArrowRightSolidIcon } from "@/components/icons";
import { getContent } from "@/lib/content-store";
import { cn } from "@/lib/utils";
import { edit, editLink } from "@/lib/editable";

/** Black "what we do" block: giant title + numbered service rows. */
export async function WhatWeDo() {
  const { home } = await getContent();
  const rows = home.serviceRows;
  return (
    <div className="bg-black text-white">
      <section className="overflow-hidden pt-20 pb-[60px] desk:pt-[100px] desk:pb-20">
        <h2 className="text-center font-heading text-[60px] leading-none text-white lowercase tab:text-[69px] desk:text-[140px]" {...edit("home.whatWeDoTitle")}>
          {home.whatWeDoTitle}
        </h2>
      </section>

      {rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        return (
          <section key={i} className={cn(isLast ? "pb-20 desk:pb-[100px]" : "pb-[60px]")}>
            <div className="mx-auto flex max-w-[1140px] items-start">
              <div className="w-[20%] pl-5 desk:pl-0">
                <div className="text-[18px] leading-none font-medium" {...edit(`home.serviceRows.${i}.number`)}>
                  {row.number}
                </div>
              </div>
              <div className="w-[45%] tab:w-[46.333%]">
                <div className="-mt-[5px] text-[30px] leading-none font-medium lowercase tab:text-[34px] desk:text-[46px]" {...edit(`home.serviceRows.${i}.title`)}>
                  {row.title}
                </div>
              </div>
              <div className="w-[30%] tab:w-[33.333%]">
                <ul>
                  {row.items.map((item, j) => (
                    <li key={j} className="flex items-center text-base leading-[1.6]">
                      <span {...edit(`home.serviceRows.${i}.items.${j}`)}>{item}</span>
                    </li>
                  ))}
                </ul>
                {isLast && (
                  <div className="mt-[60px] w-full text-center tab:w-[80%] tab:text-left desk:w-[70%]">
                    <Link
                      href={home.whatWeDoCta.href}
                      {...editLink("home.whatWeDoCta.href")}
                      className="inline-flex anim-grow items-start rounded-[50px] bg-white px-[25px] py-[18px] text-[18px] leading-[18px] font-semibold text-black"
                    >
                      <span {...edit("home.whatWeDoCta.label")}>{home.whatWeDoCta.label}</span>
                      <ArrowRightSolidIcon className="ml-[10px] h-[18px] w-[15.75px] shrink-0" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
