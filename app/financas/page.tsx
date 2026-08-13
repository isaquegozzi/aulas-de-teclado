import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import FinancesClient from "@/components/finances-client";

export default async function FinancesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <FinancesClient />;
}