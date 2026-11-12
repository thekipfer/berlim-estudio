"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Downloaded only when the admin is logged in; visitors never load it.
const EditMode = dynamic(() => import("@/components/edit-mode"), { ssr: false });

export function EditModeLoader() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setAdmin(document.cookie.split("; ").includes("berlim_edit=1"));
  }, []);

  if (!admin || pathname.startsWith("/admin")) return null;
  return <EditMode key={pathname} />;
}
