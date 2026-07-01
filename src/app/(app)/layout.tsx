import Link from "next/link";
import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SyncProvider } from "@/components/sync-provider";
import { Button } from "@/components/ui/button";
import { APP_VERSION } from "@/lib/version";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <SyncProvider>
      <div className="mx-auto min-h-screen max-w-lg px-4 pb-28 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-primary">
              Fammy
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
              {APP_VERSION}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              asChild
            >
              <Link href="/settings" aria-label="Settings">
                <Settings className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
        <AppShell userEmail={session.user.email}>{children}</AppShell>
      </div>
    </SyncProvider>
  );
}
