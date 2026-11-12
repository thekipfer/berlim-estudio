"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useContent } from "@/components/content-provider";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/** Off-canvas side menu (theme's `.mobile_menu_wrapper` + `#overlay_background`). */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { nav } = useContent();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed top-0 left-0 z-10 h-full w-full bg-black/60 transition-all duration-500",
          open ? "visible -translate-x-[270px] opacity-100 tab:-translate-x-[360px]" : "invisible opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cn(
          "fixed top-0 right-0 z-[999] box-border h-full w-[270px] overflow-x-hidden overflow-y-auto bg-black p-[30px] text-[#999] transition-transform duration-500 ease-[ease] tab:w-[360px]",
          open ? "translate-x-0" : "translate-x-[270px] tab:translate-x-[360px]",
        )}
      >
        <ul className="mt-[30px] mb-10 overflow-hidden">
          {nav.items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={onClose}
                tabIndex={open ? 0 : -1}
                className={cn(
                  "inline-block w-full font-heading text-2xl leading-[48px] text-white hover:text-white",
                  pathname === item.href ? "font-semibold" : "font-normal",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
