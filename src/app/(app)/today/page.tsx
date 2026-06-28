import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TodayPageClient } from "@/components/pages/today-page";

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">Hari Ini</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </header>
      <TodayPageClient />
    </>
  );
}
