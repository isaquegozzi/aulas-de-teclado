import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const subs = await prisma.pushSubscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: true },
  });
  return NextResponse.json(subs);
}