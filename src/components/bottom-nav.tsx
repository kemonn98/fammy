"use client";

import { CalendarDays, List, ListTodo } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavHref = "/today" | "/agenda" | "/all";

const links: { href: BottomNavHref; label: string; icon: LucideIcon }[] = [
  { href: "/today", label: "Hari Ini", icon: ListTodo },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/all", label: "Semua", icon: List },
];

interface BottomNavProps {
  activeHref: BottomNavHref;
  onNavigate: (href: BottomNavHref) => void;
}

export function BottomNav({ activeHref, onNavigate }: BottomNavProps) {
  return (
    <nav className="border-t border-border bg-background/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 pt-2 pb-8">
        {links.map(({ href, label, icon: Icon }) => {
          const active = activeHref === href;
          const navigate = () => onNavigate(href);
          return (
            <button
              key={href}
              type="button"
              onPointerDown={navigate}
              onClick={navigate}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
