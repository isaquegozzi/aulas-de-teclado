import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import MakeupsClient from "@/components/makeups-client";

export default async function MakeupsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <MakeupsClient />;
}