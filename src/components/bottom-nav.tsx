"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/today", label: "Hari Ini", icon: CalendarDays },
  { href: "/all", label: "Semua", icon: List },
  { href: "/add", label: "Tambah", icon: Plus },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs transition-colors",
                active
                  ? "text-[var(--accent)]"
                  : "text-stone-400 hover:text-stone-600",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
