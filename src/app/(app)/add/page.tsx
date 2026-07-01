import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AddTaskForm } from "@/components/add-task-form";

export default async function AddPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Add</h1>
      </header>
      <AddTaskForm userEmail={session.user.email} type="todo" />
    </>
  );
}
