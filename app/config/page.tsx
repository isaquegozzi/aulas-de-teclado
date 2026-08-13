import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ConfigClient from "@/components/config-client";

export default async function ConfigPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ConfigClient />;
}