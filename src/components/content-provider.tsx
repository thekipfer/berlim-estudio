"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteContent } from "@/types/content";

const ContentContext = createContext<SiteContent | null>(null);

/** Makes the (edited) site content available to client components. Set once in the root layout. */
export function ContentProvider({ content, children }: { content: SiteContent; children: ReactNode }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const content = useContext(ContentContext);
  if (!content) throw new Error("useContent must be used inside <ContentProvider>");
  return content;
}
