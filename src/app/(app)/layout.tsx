import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { SyncProvider } from "@/components/sync-provider";

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
          <span className="text-sm font-semibold tracking-tight text-[var(--accent)]">
            Fammy
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Keluar
            </button>
          </form>
        </div>
        {children}
      </div>
      <BottomNav />
    </SyncProvider>
  );
}
