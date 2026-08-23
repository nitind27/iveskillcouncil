"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FranchiseOption = {
  id: string;
  name: string;
};

type FranchiseFilterDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: FranchiseOption[];
  className?: string;
  variant?: "dark" | "light";
};

type MenuPos = { top: number; left: number; width: number };

export default function FranchiseFilterDropdown({
  value,
  onChange,
  options,
  className,
  variant = "dark",
}: FranchiseFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedLabel =
    value === ""
      ? "All Franchises"
      : options.find((o) => o.id === value)?.name || "All Franchises";

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 240);
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - menuWidth - 8);
    }
    setMenuPos({
      top: rect.bottom + 6,
      left,
      width: menuWidth,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReposition = () => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const isDark = variant === "dark";

  const menu =
    open && mounted && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: 99999,
            }}
            className="overflow-hidden rounded-xl border border-[#1E4A85]/20 bg-white shadow-[0_16px_40px_rgba(11,19,43,0.28)] dark:border-white/10 dark:bg-[#121a2e]"
          >
            <div className="border-b border-[#1E4A85]/10 px-3 py-2 dark:border-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1E4A85]/70 dark:text-[#C4A35A]/80">
                Select Franchise
              </p>
            </div>

            <div className="max-h-56 overflow-y-auto p-1.5">
              <DropdownItem
                selected={value === ""}
                label="All Franchises"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              />
              {options.map((opt) => (
                <DropdownItem
                  key={opt.id}
                  selected={value === opt.id}
                  label={opt.name}
                  onSelect={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={cn("relative z-20", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 min-w-[160px] max-w-[220px] items-center justify-between gap-2 rounded-lg border px-2.5 text-left text-xs font-medium transition-all",
          isDark
            ? "border-white/15 bg-white/10 text-white hover:border-[#C4A35A]/45 hover:bg-white/[0.14]"
            : "border-border bg-background text-foreground hover:border-[#1E4A85]/35",
          open && (isDark ? "border-[#C4A35A]/55 bg-white/[0.16]" : "border-[#1E4A85]/40")
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Building2
            className={cn("h-3.5 w-3.5 shrink-0", isDark ? "text-[#C4A35A]" : "text-[#1E4A85]")}
          />
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            isDark ? "text-white/70" : "text-muted-foreground",
            open && "rotate-180"
          )}
        />
      </button>
      {menu}
    </div>
  );
}

function DropdownItem({
  selected,
  label,
  onSelect,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
        selected
          ? "bg-[#1E4A85] text-white"
          : "text-slate-700 hover:bg-[#1E4A85]/8 dark:text-slate-200 dark:hover:bg-white/10"
      )}
    >
      <span className="truncate font-medium">{label}</span>
      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#C4A35A]" />}
    </button>
  );
}
