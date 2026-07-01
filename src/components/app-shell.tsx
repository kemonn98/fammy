"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TodayPageClient } from "@/components/pages/today-page";
import { AgendaPageClient } from "@/components/pages/agenda-page";
import { AllPageClient } from "@/components/pages/all-page";
import { BottomNav, type BottomNavHref } from "@/components/bottom-nav";

const TAB_PATHS: BottomNavHref[] = ["/today", "/agenda", "/all"];

function pathToTab(pathname: string): BottomNavHref | null {
  return TAB_PATHS.find((path) => pathname === path) ?? null;
}

interface AppShellProps {
  children: React.ReactNode;
  userEmail: string;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<BottomNavHref | null>(() =>
    pathToTab(pathname),
  );
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    const nextTab = pathToTab(pathname);
    activeTabRef.current = nextTab;
    setActiveTab(nextTab);
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      const nextTab = pathToTab(window.location.pathname);
      activeTabRef.current = nextTab;
      setActiveTab(nextTab);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigateTab(href: BottomNavHref) {
    if (href === activeTabRef.current) return;
    activeTabRef.current = href;
    setActiveTab(href);
    window.history.pushState(null, "", href);
  }

  if (!activeTab) return <>{children}</>;

  return (
    <>
      <div className={activeTab === "/today" ? "block" : "hidden"}>
        <TodayPageClient userEmail={userEmail} />
      </div>

      <div className={activeTab === "/agenda" ? "block" : "hidden"}>
        <AgendaPageClient userEmail={userEmail} />
      </div>

      <div className={activeTab === "/all" ? "block" : "hidden"}>
        <AllPageClient userEmail={userEmail} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50">
        <BottomNav activeHref={activeTab} onNavigate={navigateTab} />
      </div>
    </>
  );
}
