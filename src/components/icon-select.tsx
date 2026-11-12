"use client";

import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { CheckIcon, ChevronDownIcon, type IconProps } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface IconSelectOption {
  value: string;
  label: string;
  Icon: ComponentType<IconProps>;
}

interface IconSelectProps {
  id: string;
  name: string;
  options: IconSelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Value treated as "nothing chosen" when `required` is set. */
  emptyValue?: string;
  required?: boolean;
}

/** Custom dropdown (ARIA listbox pattern) so each option can show an SVG icon. */
export function IconSelect({ id, name, options, value, onChange, emptyValue = "", required }: IconSelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];
  const listId = `${id}-listbox`;

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus into the list when it opens.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openList = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
      case "Tab":
        setOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  const SelectedIcon = selected.Icon;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKeyDown}
        className="flex w-full cursor-pointer items-center gap-3 rounded-[25px] border border-black bg-white px-[15px] py-3 text-left text-base leading-[1.6] text-black outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      >
        <SelectedIcon className="size-5 shrink-0" />
        <span className="flex-1 truncate">{selected.label}</span>
        <ChevronDownIcon className={cn("size-5 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Keeps native form validation for required fields. */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={value === emptyValue ? "" : value}
        required={required}
        onChange={() => {}}
        onFocus={() => buttonRef.current?.focus()}
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
      />

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={id}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKeyDown}
          className="absolute top-[calc(100%+8px)] left-0 z-20 w-full overflow-hidden rounded-[20px] border border-black bg-white p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] outline-none"
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            const Icon = option.Icon;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-base leading-[1.6] transition-colors duration-150",
                  index === active ? "bg-black text-white" : "text-black",
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="flex-1">{option.label}</span>
                {isSelected && <CheckIcon className="size-4 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
