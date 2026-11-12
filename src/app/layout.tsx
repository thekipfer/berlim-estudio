import type { Metadata, Viewport } from "next";
import { Public_Sans, Urbanist } from "next/font/google";
import { ContentProvider } from "@/components/content-provider";
import { EditModeLoader } from "@/components/edit-mode-loader";
import { getContent } from "@/lib/content-store";
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

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getContent();
  return {
    title: site.title,
    description: site.description,
    openGraph: { type: "website", title: site.title, description: site.description },
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
    <html lang="en-US" className={`${publicSans.variable} ${urbanist.variable}`}>
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>
        <ContentProvider content={content}>
          {children}
          <EditModeLoader />
        </ContentProvider>
      </body>
    </html>
  );
}
