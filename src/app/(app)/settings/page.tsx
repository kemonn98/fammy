import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsPageClient } from "@/components/pages/settings-page";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return <SettingsPageClient userEmail={session.user.email} />;
}
