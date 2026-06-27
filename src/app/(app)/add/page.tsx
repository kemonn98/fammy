import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPartnerEmail } from "@/lib/utils";
import { AddTaskForm } from "@/components/add-task-form";

export default async function AddPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const partnerEmail = getPartnerEmail(session.user.email);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Tambah</h1>
      </header>
      <AddTaskForm
        userEmail={session.user.email}
        partnerEmail={partnerEmail}
      />
    </>
  );
}
