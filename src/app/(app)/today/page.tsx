import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TodayPageClient } from "@/components/pages/today-page";

export default async function TodayPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Hari Ini</h1>
        <p className="text-sm text-stone-400">
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
