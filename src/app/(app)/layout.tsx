import Link from "next/link";
import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SyncProvider } from "@/components/sync-provider";
import { Button } from "@/components/ui/button";

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
          <span className="text-sm font-semibold tracking-tight text-primary">
            Fammy
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              asChild
            >
              <Link href="/settings" aria-label="Pengaturan">
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
