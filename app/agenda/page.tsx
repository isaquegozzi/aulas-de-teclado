import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AgendaClient from "@/components/agenda-client";

export default async function AgendaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AgendaClient />;
}