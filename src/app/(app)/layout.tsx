import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { SyncProvider } from "@/components/sync-provider";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SyncProvider>
      <div className="mx-auto min-h-screen max-w-lg px-4 pb-24 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-primary">
            Fammy
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              Keluar
            </Button>
          </form>
        </div>
        {children}
      </div>
      <BottomNav />
    </SyncProvider>
  );
}
