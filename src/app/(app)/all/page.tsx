import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AllPageClient } from "@/components/pages/all-page";

export default async function AllPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Semua</h1>
      </header>
      <AllPageClient />
    </>
  );
}
