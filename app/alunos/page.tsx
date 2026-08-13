import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import StudentsClient from "@/components/students-client";

export default async function StudentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <StudentsClient />;
}