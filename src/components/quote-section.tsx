import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { getContent } from "@/lib/content-store";
import { edit, editHighlight, editLink } from "@/lib/editable";

/** Quote with hand-drawn underline strokes under the chosen words, plus the CTA button. */
/** Splits the quote around the highlighted words (case-insensitive). Null when they aren't in the quote. */
function splitQuote(quote: string, highlight: string) {
  const words = highlight.trim();
  const at = words ? quote.toLowerCase().indexOf(words.toLowerCase()) : -1;
  if (at < 0) return null;
  return { before: quote.slice(0, at), match: quote.slice(at, at + words.length), after: quote.slice(at + words.length) };
}

export async function QuoteSection() {
  const { home } = await getContent();
  const parts = splitQuote(home.quote, home.quoteHighlight);
  return (
    <section className="py-[60px] tab:py-20 desk:py-[100px]">
      <div className="mx-auto max-w-[1140px]">
        <div className="relative flex flex-wrap justify-center px-5 tab:px-0">
          <h2
            className="w-full text-center font-heading text-[26px] leading-[1.4] tab:w-[80%] tab:text-left tab:text-[30px] tab:leading-[1.3] desk:w-[70%] desk:text-[36px] desk:leading-[1.2]"
            {...edit("home.quote")}
            {...editHighlight("home.quoteHighlight")}
          >
            {parts ? (
              <>
                {parts.before}
                {/* Chosen words get the two hand-drawn brush strokes underneath. */}
                <span className="relative inline-block">
                  {parts.match}
                  <span aria-hidden="true" contentEditable={false} suppressContentEditableWarning className="contents">
                  <Reveal
                    as="span"
                    offset="-10%"
                    className="pointer-events-none absolute top-[calc(100%-0.18em)] -left-[2%] block w-[104%] transition-all duration-600 ease-smoove select-none"
                    hiddenClassName="smoove:scale-x-[0.1] smoove:opacity-0"
                  >
                    <Image src="/images/line-1.png" alt="" width={542} height={22} className="block h-auto w-full" />
                  </Reveal>
                  <Reveal
                    as="span"
                    offset="-10%"
                    className="pointer-events-none absolute top-[calc(100%-0.02em)] left-0 block w-[110%] transition-all delay-100 duration-600 ease-smoove select-none"
                    hiddenClassName="smoove:scale-x-[0.1] smoove:opacity-0"
                  >
                    <Image src="/images/line-2.png" alt="" width={600} height={18} className="block h-auto w-full" />
                  </Reveal>
                  </span>
                </span>
                {parts.after}
              </>
            ) : (
              home.quote
            )}
          </h2>

          <div className="h-[50px] w-full desk:h-[60px]" />

          <div className="w-full text-center tab:w-[80%] tab:text-left desk:w-[70%]">
            <Link
              href={home.quoteCta.href}
              {...editLink("home.quoteCta.href")}
              {...edit("home.quoteCta.label")}
              className="inline-block anim-grow rounded-[50px] bg-black px-[25px] py-[18px] text-center text-[18px] leading-[18px] font-semibold text-white"
            >
              {home.quoteCta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
