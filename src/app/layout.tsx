import type { Metadata, Viewport } from "next";
import { Public_Sans, Urbanist } from "next/font/google";
import { ContentProvider } from "@/components/content-provider";
import { EditModeLoader } from "@/components/edit-mode-loader";
import { JsonLd } from "@/components/seo/json-ld";
import { getContent } from "@/lib/content-store";
import { SITE_NAME, SITE_URL, organizationJsonLd, pageSeo } from "@/lib/seo";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Defaults for every route; each page sets its own title, description, canonical and preview image. */
export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const { description } = pageSeo(content, "home");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: content.site.title || SITE_NAME, template: `%s | ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: { telephone: true, email: true, address: true },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NAME },
    twitter: { card: "summary_large_image" },
    // Google Search Console: set GOOGLE_SITE_VERIFICATION in Vercel (the code from the HTML-tag method).
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getContent();
  return (
    <html lang="pt-BR" className={`${publicSans.variable} ${urbanist.variable}`}>
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>
        <JsonLd data={organizationJsonLd(content)} />
        <ContentProvider content={content}>
          {children}
          <EditModeLoader />
        </ContentProvider>
      </body>
    </html>
  );
}
