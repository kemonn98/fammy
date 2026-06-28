import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPartnerEmail } from "@/lib/utils";
import { AllPageClient } from "@/components/pages/all-page";

export default async function AllPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const partnerEmail = getPartnerEmail(session.user.email);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Semua</h1>
      </header>
      <AllPageClient partnerEmail={partnerEmail} />
    </>
  );
}
