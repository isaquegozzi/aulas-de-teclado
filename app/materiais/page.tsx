import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import MaterialsClient from "@/components/materials-client";

export default async function MaterialsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <MaterialsClient />;
}