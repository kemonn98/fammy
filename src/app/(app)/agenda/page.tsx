import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AgendaPageClient } from "@/components/pages/agenda-page";

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
        <p className="text-sm text-muted-foreground">Jadwal & acara bersama</p>
      </header>
      <AgendaPageClient />
    </>
  );
}
